import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LineChart = ({ data, dataKey, xKey = 'name', className = '' }) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
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
          <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;

