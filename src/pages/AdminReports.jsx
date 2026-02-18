
import React, { useState } from 'react';
import { Button, DatePicker, message, Card, Typography, Space } from 'antd';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminReports = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);

    const handleExport = async (table) => {
        setLoading(true);
        try {
            let query = supabase.from(table).select('*').eq('sacco_id', profile.sacco_id);
            if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
                // Ant Design RangePicker returns dayjs objects — call .toISOString() on them
                query = query
                    .gte('created_at', dateRange[0].toISOString())
                    .lte('created_at', dateRange[1].toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data.length) {
                message.info('No data found for the selected range.');
                return;
            }

            // Convert to CSV
            const csvRows = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvRows], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', `${table}_report_${new Date().toISOString()}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            message.success(`${table} report exported successfully`);
        } catch (err) {
            message.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}>Reports</Title>
            <Card title="Export Data" bordered={false}>
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    <RangePicker onChange={setDateRange} />
                    <Space>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('members')} loading={loading}>
                            Export Members
                        </Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('savings_transactions')} loading={loading}>
                            Export Transactions
                        </Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('loans')} loading={loading}>
                            Export Loans
                        </Button>
                    </Space>
                </Space>
            </Card>
        </div>
    );
};

export default AdminReports;
