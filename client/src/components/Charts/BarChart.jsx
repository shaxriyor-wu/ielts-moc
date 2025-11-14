import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChart = ({ data, dataKey, xKey = 'name', className = '' }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;

