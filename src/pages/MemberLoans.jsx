
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Tag, Space, Typography } from 'antd';
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const MemberLoans = () => {
    const { profile } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (profile?.sacco_id) {
            fetchLoans();
        }
    }, [profile]);

    const fetchLoans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('member_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            message.error("Failed to fetch loans");
        } else {
            setLoans(data);
        }
        setLoading(false);
    };

    const handleApplyLoan = async (values) => {
        try {
            const { amount } = values;

            // Basic validation
            if (amount <= 0) throw new Error("Loan amount must be positive");

            const { error } = await supabase.from('loans').insert([{
                sacco_id: profile.sacco_id,
                member_id: profile.id,
                amount,
                status: 'pending'
            }]);

            if (error) throw error;
            message.success('Loan application submitted!');
            setModalVisible(false);
            form.resetFields();
            fetchLoans();
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        { title: 'Date Applied', dataIndex: 'created_at', key: 'date', render: d => new Date(d).toLocaleDateString() },
        { title: 'Amount (UGX)', dataIndex: 'amount', key: 'amount', render: amt => parseFloat(amt).toLocaleString() },
        {
            title: 'Status', dataIndex: 'status', key: 'status', render: status => {
                let color = 'geekblue';
                let icon = <ClockCircleOutlined />;
                if (status === 'approved') { color = 'green'; icon = <CheckCircleOutlined />; }
                if (status === 'rejected') { color = 'volcano'; icon = <CloseCircleOutlined />; }
                if (status === 'disbursed') { color = 'blue'; icon = <DollarOutlined />; }
                if (status === 'repaid') { color = 'gold'; }

                return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
            }
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={3}>My Loans</Title>
                <Button type="primary" icon={<DollarOutlined />} onClick={() => setModalVisible(true)}>
                    Apply for Loan
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={loans}
                rowKey="id"
                loading={loading}
            />

            <Modal
                title="Apply for a Loan"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleApplyLoan}>
                    <Form.Item name="amount" label="Requested Amount (UGX)" rules={[{ required: true, message: 'Please enter amount' }]}>
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            min={1000}
                        />
                    </Form.Item>
                    <Text type="secondary">
                        Note: Your loan will be reviewed by the admin. Check back for status updates.
                    </Text>
                </Form>
            </Modal>
        </div>
    );
};

export default MemberLoans;
