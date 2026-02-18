
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Steps, message } from 'antd';
import { BankOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const RegisterSacco = () => {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState('');

    const onFinish = async (values) => {
        setLoading(true);
        setErrorMsg('');
        const { saccoName, adminName, email, password } = values;

        try {
            // 1. Sign up the user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: adminName }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Call the RPC function to create the Sacco and Admin record
                // Note: The RPC function might need to be adjusted to accept the user_id if we want to link strictly, 
                // but based on current schema, we link via email.
                const { data: saccoId, error: rpcError } = await supabase.rpc('create_new_sacco', {
                    sacco_name: saccoName,
                    admin_name: adminName,
                    admin_email: email
                });

                if (rpcError) {
                    // If RPC fails, we might want to warn the user, though the auth user is created.
                    console.error("RPC Error:", rpcError);
                    throw new Error("Failed to initialize system data: " + rpcError.message);
                }

                message.success('Registration successful! Please check your email for confirmation (if enabled) or login.');
                navigate('/login');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: 20 }}>
            <Card style={{ width: 500, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={2}>Register Sacco</Title>
                    <Text type="secondary">Onboard your SACCO to SaccoFlow</Text>
                </div>

                {errorMsg && <Alert message="Registration Error" description={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="saccoName"
                        label="SACCO Name"
                        rules={[{ required: true, message: 'Please enter your SACCO name' }]}
                    >
                        <Input prefix={<BankOutlined />} placeholder="e.g. Kampala Teachers SACCO" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="adminName"
                        label="Administrator Name"
                        rules={[{ required: true, message: 'Please enter the admin name' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Admin Email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="admin@sacco.com" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Secure Password" size="large" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            Register Now
                        </Button>
                    </Form.Item>
                </Form>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    Already have an account? <Link to="/login">Login here</Link>
                </div>
            </Card>
        </div>
    );
};

export default RegisterSacco;
