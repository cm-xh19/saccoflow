
import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, theme } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    UserOutlined,
    DollarOutlined,
    FileTextOutlined,
    LogoutOutlined,
    BankOutlined,
    TeamOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, signOut, role } = useAuth();
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = role === 'admin' ? [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/admin/members',
            icon: <TeamOutlined />,
            label: 'Members',
        },
        {
            key: '/admin/transactions',
            icon: <DollarOutlined />,
            label: 'Transactions',
        },
        {
            key: '/admin/loans',
            icon: <BankOutlined />,
            label: 'Loans',
        },
        {
            key: '/admin/reports',
            icon: <FileTextOutlined />,
            label: 'Reports',
        },
        {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
    ] : [
        {
            key: '/member/dashboard',
            icon: <DashboardOutlined />,
            label: 'Overview',
        },
        {
            key: '/member/accounts',
            icon: <DollarOutlined />,
            label: 'My Accounts',
        },
        {
            key: '/member/loans',
            icon: <BankOutlined />,
            label: 'My Loans',
        },
        {
            key: '/member/transactions',
            icon: <FileTextOutlined />,
            label: 'History',
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" collapsedWidth="80">
                <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={(e) => navigate(e.key)}
                />
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: 'white' }}>
                        {!collapsed && 'Logout'}
                    </Button>
                </div>
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Title level={4} style={{ margin: 0 }}>SaccoFlow {role === 'admin' ? '- Admin' : '- Member'}</Title>
                    <Space>
                        <span>{user?.email}</span>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: 'auto'
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
