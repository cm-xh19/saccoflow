
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, Select, message, Space, Typography, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminTransactions = () => {
    const { profile } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [members, setMembers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        if (profile?.sacco_id) {
            fetchTransactions();
            fetchMembers();
        }
    }, [profile]);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('savings_transactions')
            .select('*, member:members(name)')
            .eq('sacco_id', profile.sacco_id)
            .order('created_at', { ascending: false });

        if (error) {
            message.error("Failed to fetch transactions");
            console.error(error);
        } else {
            setTransactions(data);
        }
        setLoading(false);
    };

    const fetchMembers = async () => {
        const { data } = await supabase.from('members').select('id, name').eq('sacco_id', profile.sacco_id);
        setMembers(data || []);
    };

    // When member is selected, check if they have accounts, if not create default ones? Or list existing.
    const handleMemberSelect = async (memberId) => {
        setSelectedMember(memberId);
        // Fetch accounts for this member
        let { data } = await supabase.from('accounts').select('*').eq('member_id', memberId);

        // If no accounts, maybe create defaults (Savings, Shares) automatically?
        if (!data || data.length === 0) {
            // Auto-create for UX simplicity
            const defaults = [
                { sacco_id: profile.sacco_id, member_id: memberId, type: 'savings', current_balance: 0 },
                { sacco_id: profile.sacco_id, member_id: memberId, type: 'shares', current_balance: 0 }
            ];
            const result = await supabase.from('accounts').insert(defaults).select();
            if (result.data) data = result.data;
        }
        setAccounts(data || []);
    };

    const handleTransaction = async (values) => {
        try {
            const { memberId, accountId, type, amount } = values;

            // Log transaction
            const { error } = await supabase.from('savings_transactions').insert([{
                sacco_id: profile.sacco_id,
                member_id: memberId,
                account_id: accountId,
                type,
                amount,
                created_by: profile.id // Admin usage
            }]);

            if (error) throw error;

            // Note: If triggers are set up (triggers.sql), account balance updates automatically.
            // If not, we might need a manual update here, but let's assume triggers run.

            message.success('Transaction recorded successfully');
            setModalVisible(false);
            form.resetFields();
            setSelectedMember(null);
            setAccounts([]);
            fetchTransactions();
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'created_at', key: 'date', render: d => new Date(d).toLocaleString() },
        { title: 'Member', dataIndex: ['member', 'name'], key: 'member' },
        {
            title: 'Type', dataIndex: 'type', key: 'type', render: type => (
                <Tag color={type === 'deposit' ? 'green' : 'red'}>{type.toUpperCase()}</Tag>
            )
        },
        { title: 'Amount', dataIndex: 'amount', key: 'amount', render: amt => `UGX ${parseFloat(amt).toLocaleString()}` },
        { title: 'Recorded By', dataIndex: 'created_by', key: 'created_by', render: () => 'Admin' }, // Placeholder or fetch admin name
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={3}>Transactions</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    New Transaction
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={transactions}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Record Transaction"
                open={modalVisible}
                onCancel={() => { setModalVisible(false); form.resetFields(); setSelectedMember(null); setAccounts([]); }}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleTransaction}>
                    <Form.Item name="memberId" label="Member" rules={[{ required: true }]}>
                        <Select
                            showSearch
                            placeholder="Select a member"
                            optionFilterProp="children"
                            onChange={handleMemberSelect}
                        >
                            {members.map(m => (
                                <Option key={m.id} value={m.id}>{m.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="accountId" label="Account Type" rules={[{ required: true }]}>
                        <Select placeholder="Select account (Savings/Shares)" disabled={!selectedMember}>
                            {accounts.map(acc => (
                                <Option key={acc.id} value={acc.id}>{acc.type.toUpperCase()} (Bal: {acc.current_balance})</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="type" label="Transaction Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value="deposit">Deposit</Option>
                            <Option value="withdrawal">Withdrawal</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="amount" label="Amount (UGX)" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminTransactions;
