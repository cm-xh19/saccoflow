
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Space, Typography, Tag, Progress } from 'antd';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { DollarCircleOutlined, TeamOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const AdminDashboard = () => {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState({
        members: 0,
        totalSavings: 0,
        totalLoans: 0,
        activeSaccos: 1 // Default for single sacco
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.sacco_id) {
            fetchStats(profile.sacco_id);
        }
    }, [profile]);

    const fetchStats = async (saccoId) => {
        try {
            // Count members
            const { count: membersCount } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('sacco_id', saccoId);

            // Sum savings (from accounts table)
            const { data: savingsData } = await supabase
                .from('accounts')
                .select('current_balance')
                .eq('sacco_id', saccoId)
                .eq('type', 'savings');

            const totalSavings = savingsData?.reduce((acc, curr) => acc + (parseFloat(curr.current_balance) || 0), 0) || 0;

            // Sum active loans
            const { data: loansData } = await supabase
                .from('loans')
                .select('amount')
                .eq('sacco_id', saccoId)
                .in('status', ['approved', 'disbursed']);

            const totalLoans = loansData?.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) || 0;

            setStats({
                members: membersCount || 0,
                totalSavings,
                totalLoans,
                activeSaccos: 1
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Admin Dashboard</Title>
            <Text type="secondary">Overview of {profile?.name || 'SACCO'} Operations</Text>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Total Members"
                            value={stats.members}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                        <Link to="/admin/members">View Members</Link>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Total Savings"
                            value={stats.totalSavings}
                            precision={2}
                            prefix={<DollarCircleOutlined />}
                            suffix="UGX"
                            valueStyle={{ color: '#1677ff' }}
                        />
                        <Link to="/admin/transactions">View Transactions</Link>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Active Loans"
                            value={stats.totalLoans}
                            precision={2}
                            valueStyle={{ color: '#cf1322' }}
                            prefix={<RiseOutlined />}
                            suffix="UGX"
                        />
                        <Link to="/admin/loans">Manage Loans</Link>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    {/* Placeholder chart or recent activity */}
                    <Card title="Quick Actions" bordered={false}>
                        <Space wrap>
                            <Button type="primary" href="/admin/members">Add New Member</Button>
                            <Button href="/admin/loans">Approve Pending Loans</Button>
                            <Button href="/admin/reports">Generate Monthly Report</Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
