import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag } from 'antd';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { DollarCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const MemberDashboard = () => {
    const { profile } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loanStatus, setLoanStatus] = useState(null);

    useEffect(() => {
        if (profile?.id) {
            fetchMyData();
        }
    }, [profile]);

    const fetchMyData = async () => {
        // Fetch accounts linked to this member
        const { data: accData } = await supabase
            .from('accounts')
            .select('*')
            .eq('member_id', profile.id);

        setAccounts(accData || []);

        // Fetch latest loan — use maybeSingle() instead of single() to avoid error when no rows exist
        const { data: loanData } = await supabase
            .from('loans')
            .select('status, amount')
            .eq('member_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); // Safe: returns null instead of error when no rows

        setLoanStatus(loanData || null);
    };

    const savings = accounts.find((a) => a.type === 'savings')?.current_balance || 0;
    const shares = accounts.find((a) => a.type === 'shares')?.current_balance || 0;

    const loanStatusColorMap = {
        pending: 'geekblue',
        approved: 'green',
        disbursed: 'blue',
        rejected: 'volcano',
        repaid: 'gold',
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Welcome, {profile?.name}</Title>
            <Text type="secondary">Member Dashboard</Text>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12}>
                    <Card>
                        <Statistic
                            title="My Savings"
                            value={savings}
                            precision={2}
                            prefix={<WalletOutlined />}
                            suffix="UGX"
                            valueStyle={{ color: '#3f8600' }}
                        />
                        <Link to="/member/accounts">View Details</Link>
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card>
                        <Statistic
                            title="My Shares"
                            value={shares}
                            precision={2}
                            prefix={<DollarCircleOutlined />}
                            suffix="UGX"
                            valueStyle={{ color: '#1677ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title="Loan Status"
                        extra={<Link to="/member/loans">Apply for Loan</Link>}
                    >
                        {loanStatus ? (
                            <div>
                                <Text strong>Latest Loan:</Text>{' '}
                                UGX {parseFloat(loanStatus.amount).toLocaleString()}
                                <br />
                                <Tag
                                    color={loanStatusColorMap[loanStatus.status] || 'default'}
                                    style={{ marginTop: 8 }}
                                >
                                    {loanStatus.status?.toUpperCase()}
                                </Tag>
                            </div>
                        ) : (
                            <Text type="secondary">No loans yet. Apply for one above.</Text>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default MemberDashboard;
