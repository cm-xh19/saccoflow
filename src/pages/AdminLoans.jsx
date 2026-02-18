import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Removed unused: Modal, Form, InputNumber, Select, Option, modalVisible state

const { Title } = Typography;

const AdminLoans = () => {
    const { profile } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.sacco_id) {
            fetchLoans();
        }
    }, [profile]);

    const fetchLoans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('loans')
            .select('*, member:members(name)')
            .eq('sacco_id', profile.sacco_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            message.error('Failed to fetch loans');
        } else {
            setLoans(data);
        }
        setLoading(false);
    };

    const handleAction = async (id, status) => {
        try {
            const { error } = await supabase
                .from('loans')
                .update({ status, approved_by: profile.id })
                .eq('id', id);

            if (error) throw error;
            message.success(`Loan marked as ${status}`);
            fetchLoans();
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: 'Date', dataIndex: 'created_at', key: 'date',
            render: (d) => new Date(d).toLocaleDateString(),
        },
        {
            title: 'Member', dataIndex: ['member', 'name'], key: 'member',
        },
        {
            title: 'Amount (UGX)', dataIndex: 'amount', key: 'amount',
            render: (amt) => parseFloat(amt).toLocaleString(),
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (status) => {
                const colorMap = {
                    pending: 'geekblue',
                    approved: 'green',
                    disbursed: 'blue',
                    rejected: 'volcano',
                    repaid: 'gold',
                };
                return <Tag color={colorMap[status] || 'default'}>{status?.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Actions', key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' && (
                        <>
                            <Button
                                type="primary" size="small" icon={<CheckOutlined />}
                                onClick={() => handleAction(record.id, 'approved')}
                            >
                                Approve
                            </Button>
                            <Button
                                danger size="small" icon={<CloseOutlined />}
                                onClick={() => handleAction(record.id, 'rejected')}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {record.status === 'approved' && (
                        <Button
                            type="primary" ghost size="small" icon={<DollarOutlined />}
                            onClick={() => handleAction(record.id, 'disbursed')}
                        >
                            Disburse
                        </Button>
                    )}
                    {record.status === 'disbursed' && (
                        <Button
                            size="small"
                            onClick={() => handleAction(record.id, 'repaid')}
                        >
                            Mark Repaid
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Loan Management</Title>
            <Table
                columns={columns}
                dataSource={loans}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default AdminLoans;
