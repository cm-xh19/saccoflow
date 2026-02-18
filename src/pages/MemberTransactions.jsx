
import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const MemberTransactions = () => {
    const { profile } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.id) fetchTransactions();
    }, [profile]);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('savings_transactions')
            .select('*')
            .eq('member_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            message.error("Failed to load transactions");
        } else {
            setTransactions(data);
        }
        setLoading(false);
    };

    const columns = [
        { title: 'Date', dataIndex: 'created_at', key: 'date', render: d => new Date(d).toLocaleString() },
        {
            title: 'Type', dataIndex: 'type', key: 'type', render: t => (
                <Tag color={t === 'deposit' ? 'green' : 'red'}>{t.toUpperCase()}</Tag>
            )
        },
        { title: 'Amount (UGX)', dataIndex: 'amount', key: 'amount', render: a => parseFloat(a).toLocaleString() },
        { title: 'Status', key: 'status', render: () => <Tag color="blue">COMPLETED</Tag> }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Transaction History</Title>
            <Table
                columns={columns}
                dataSource={transactions}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default MemberTransactions;
