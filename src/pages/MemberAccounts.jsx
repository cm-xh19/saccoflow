import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Input, message, Tag, Typography } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Removed unused: Card, Select, WalletOutlined, PlusCircleOutlined, Option

const { Title } = Typography;

const MemberAccounts = () => {
    const { profile } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [withdrawalVisible, setWithdrawalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.id) fetchAccounts();
    }, [profile]);

    const fetchAccounts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('member_id', profile.id);

        if (error) message.error('Failed to load accounts');
        else setAccounts(data || []);
        setLoading(false);
    };

    const openWithdrawModal = (record) => {
        setSelectedAccount(record);
        form.resetFields();
        setWithdrawalVisible(true);
    };

    const handleWithdrawalRequest = async (values) => {
        try {
            const { amount } = values;

            if (!selectedAccount) throw new Error('No account selected');
            if (parseFloat(selectedAccount.current_balance) < amount) {
                throw new Error('Insufficient balance for withdrawal');
            }

            const { error } = await supabase.from('withdrawal_requests').insert([{
                sacco_id: profile.sacco_id,
                member_id: profile.id,
                amount,
                status: 'pending',
            }]);

            if (error) throw error;
            message.success('Withdrawal request submitted for approval');
            setWithdrawalVisible(false);
            form.resetFields();
            setSelectedAccount(null);
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'Account Type', dataIndex: 'type', key: 'type',
            render: (t) => (
                <Tag color={t === 'savings' ? 'blue' : 'purple'}>{t?.toUpperCase()}</Tag>
            ),
        },
        {
            title: 'Balance (UGX)', dataIndex: 'current_balance', key: 'balance',
            render: (b) => parseFloat(b).toLocaleString(),
        },
        {
            title: 'Created', dataIndex: 'created_at', key: 'created',
            render: (d) => new Date(d).toLocaleDateString(),
        },
        {
            title: 'Action', key: 'action',
            render: (_, record) => (
                <Button
                    size="small"
                    danger
                    icon={<MinusCircleOutlined />}
                    disabled={parseFloat(record.current_balance) <= 0}
                    onClick={() => openWithdrawModal(record)}
                >
                    Withdraw
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>My Accounts</Title>
            <Table
                columns={columns}
                dataSource={accounts}
                rowKey="id"
                loading={loading}
                pagination={false}
            />

            <Modal
                title={`Request Withdrawal${selectedAccount ? ` — ${selectedAccount.type?.toUpperCase()} Account` : ''}`}
                open={withdrawalVisible}
                onCancel={() => { setWithdrawalVisible(false); setSelectedAccount(null); }}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleWithdrawalRequest}>
                    {/* accountId is tracked via selectedAccount state — no hidden field needed */}
                    <Form.Item
                        name="amount"
                        label={`Amount (UGX) — Available: ${parseFloat(selectedAccount?.current_balance || 0).toLocaleString()}`}
                        rules={[{ required: true, message: 'Please enter an amount' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            min={100}
                            max={parseFloat(selectedAccount?.current_balance || 0)}
                        />
                    </Form.Item>
                    <div style={{ color: 'gray', fontSize: 12 }}>
                        Note: Withdrawals require admin approval before processing.
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default MemberAccounts;
