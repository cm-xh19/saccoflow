import React, { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select,
    Tag, Popconfirm, message, Space, Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useAudit } from '../hooks/useAudit';

const { Title } = Typography;
const { Option } = Select;

const AdminMembers = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentMember, setCurrentMember] = useState(null);
    const [form] = Form.useForm();
    const { profile } = useAuth();
    const { logAction } = useAudit();

    useEffect(() => {
        if (profile?.sacco_id) {
            fetchMembers();
        }
    }, [profile]);

    const fetchMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('sacco_id', profile.sacco_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            message.error('Failed to load members.');
        } else {
            setMembers(data);
        }
        setLoading(false);
    };

    const handleAddMember = async (values) => {
        try {
            const { name, email, phone, status } = values;
            const { data, error } = await supabase
                .from('members')
                .insert([{ sacco_id: profile.sacco_id, name, email, phone, status }])
                .select()
                .single();

            if (error) throw error;

            logAction('create_member', 'members', data.id);
            message.success('Member added successfully');
            setModalVisible(false);
            form.resetFields();
            fetchMembers();
        } catch (err) {
            message.error(err.message);
        }
    };

    const handleUpdateMember = async (values) => {
        try {
            const { name, email, phone, status } = values;
            const { error } = await supabase
                .from('members')
                .update({ name, email, phone, status })
                .eq('id', currentMember.id);

            if (error) throw error;

            logAction('update_member', 'members', currentMember.id);
            message.success('Member updated successfully');
            setModalVisible(false);
            setIsEditing(false);
            setCurrentMember(null);
            fetchMembers();
        } catch (err) {
            message.error(err.message);
        }
    };

    const handleDeleteMember = async (id) => {
        try {
            const { error } = await supabase.from('members').delete().eq('id', id);
            if (error) throw error;

            logAction('delete_member', 'members', id);
            message.success('Member removed');
            fetchMembers();
        } catch (err) {
            message.error(err.message);
        }
    };

    const openEditModal = (record) => {
        setIsEditing(true);
        setCurrentMember(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const openAddModal = () => {
        setIsEditing(false);
        setCurrentMember(null);
        form.resetFields();
        setModalVisible(true);
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Phone', dataIndex: 'phone', key: 'phone' },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'volcano'}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Joined', dataIndex: 'created_at', key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions', key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)} />
                    <Popconfirm
                        title="Delete this member?"
                        onConfirm={() => handleDeleteMember(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={3}>Member Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                    Add Member
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={members}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={isEditing ? 'Edit Member' : 'Add New Member'}
                open={modalVisible}
                onCancel={() => { setModalVisible(false); form.resetFields(); }}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={isEditing ? handleUpdateMember : handleAddMember}
                >
                    <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone">
                        <Input />
                    </Form.Item>
                    <Form.Item name="status" label="Status" initialValue="active">
                        <Select>
                            <Option value="active">Active</Option>
                            <Option value="inactive">Inactive</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminMembers;
