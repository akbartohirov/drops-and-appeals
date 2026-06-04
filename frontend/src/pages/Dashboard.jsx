import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  FileText, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ArrowRight,
  UserCheck2
} from 'lucide-react';

// Premium interactive SVG Line Chart
const PremiumLineChart = ({ data, timeFilter }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const svgHeight = 250;
  const containerRef = React.useRef(null);
  
  // Responsive handling
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      setSvgWidth(containerRef.current.clientWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const padding = { top: 30, right: 40, bottom: 40, left: 50 };
  const maxVal = Math.max(...data.map(d => d.count), 5);
  const yMax = Math.ceil(maxVal * 1.15); // Add 15% headroom

  // Calculate coordinates for points
  const points = data.map((d, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * (svgWidth - padding.left - padding.right);
    const y = svgHeight - padding.bottom - (d.count / yMax) * (svgHeight - padding.top - padding.bottom);
    return { x, y, label: d.label, count: d.count, actualCount: d.actualCount };
  });

  // Generate cubic bezier path for smooth line
  const getSvgPath = (pts) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = getSvgPath(points);
  
  // Path for gradient fill
  const fillPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding.bottom} L ${points[0].x} ${svgHeight - padding.bottom} Z`
    : '';

  const handleMouseMove = (e) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    points.forEach((pt, index) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = index;
      }
    });
    
    setHoveredIndex(nearestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const yGridTicks = [0, 0.25, 0.5, 0.75, 1];
  const isOylik = timeFilter === 'oylik';

  return (
    <div ref={containerRef} className="relative w-full select-none" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <svg width="100%" height={svgHeight} className="overflow-visible">
        <defs>
          <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#003366" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#003366" stopOpacity="0.00" />
          </linearGradient>
          <filter id="line-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#003366" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Horizontal grid lines & Y-Axis labels */}
        {yGridTicks.map((tick, index) => {
          const yVal = svgHeight - padding.bottom - tick * (svgHeight - padding.top - padding.bottom);
          const labelVal = Math.round(tick * yMax);
          return (
            <g key={index} className="opacity-40">
              <line 
                x1={padding.left} 
                y1={yVal} 
                x2={svgWidth - padding.right} 
                y2={yVal} 
                stroke="#E5E7EB" 
                strokeDasharray="4,4" 
              />
              <text 
                x={padding.left - 12} 
                y={yVal + 4} 
                textAnchor="end" 
                className="text-[10px] fill-outline font-semibold font-mono"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* X-Axis labels */}
        {points.map((pt, index) => {
          // If monthly view (30 days), show every 3rd day to avoid cluttering labels
          const shouldShowLabel = !isOylik || (index === 0 || index === points.length - 1 || (index + 1) % 3 === 0);
          if (!shouldShowLabel) return null;
          
          return (
            <text 
              key={index} 
              x={pt.x} 
              y={svgHeight - padding.bottom + 20} 
              textAnchor="middle" 
              className="text-[10px] fill-outline font-semibold"
            >
              {isOylik ? `${pt.label}` : pt.label}
            </text>
          );
        })}

        {/* Area Gradient under curve */}
        {points.length > 0 && fillPath && (
          <path d={fillPath} fill="url(#chart-gradient)" />
        )}

        {/* Spline Path */}
        {points.length > 0 && linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="#003366" 
            strokeWidth={3} 
            strokeLinecap="round"
            filter="url(#line-shadow)"
          />
        )}

        {/* Interactive glow-point & grid line on hover */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <g>
            <line 
              x1={points[hoveredIndex].x} 
              y1={padding.top} 
              x2={points[hoveredIndex].x} 
              y2={svgHeight - padding.bottom} 
              stroke="#003366" 
              strokeWidth={1} 
              strokeDasharray="3,3" 
              className="opacity-50"
            />
            <circle 
              cx={points[hoveredIndex].x} 
              cy={points[hoveredIndex].y} 
              r={8} 
              fill="#003366" 
              className="opacity-20 animate-ping"
            />
            <circle 
              cx={points[hoveredIndex].x} 
              cy={points[hoveredIndex].y} 
              r={5} 
              fill="#FFFFFF" 
              stroke="#003366" 
              strokeWidth={3} 
            />
            <circle 
              cx={points[hoveredIndex].x} 
              cy={points[hoveredIndex].y} 
              r={2} 
              fill="#003366" 
            />
          </g>
        )}
      </svg>

      {/* Elegant floating tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div 
          className="absolute bg-primary text-white text-[11px] rounded-xl shadow-xl px-3 py-2.5 border border-white/10 pointer-events-none z-10 transition-all duration-150 flex flex-col gap-1 min-w-[130px]"
          style={{ 
            left: `${Math.min(svgWidth - 145, Math.max(10, points[hoveredIndex].x - 65))}px`, 
            top: `${Math.max(5, points[hoveredIndex].y - 80)}px` 
          }}
        >
          <span className="font-semibold text-blue-100 uppercase tracking-wider text-[9px]">
            {isOylik ? `${points[hoveredIndex].label}-Iyun 2026` : `${points[hoveredIndex].label} 2026`}
          </span>
          <div className="flex justify-between items-baseline gap-2 mt-0.5">
            <span className="opacity-85">Murojaatlar:</span>
            <span className="font-bold text-sm text-tertiary-fixed-dim">{points[hoveredIndex].count} ta</span>
          </div>
          {points[hoveredIndex].actualCount > 0 && (
            <div className="text-[9px] text-emerald-300 font-medium flex items-center justify-between mt-0.5 border-t border-white/5 pt-1">
              <span>Haqiqiy faollik:</span>
              <span>+{points[hoveredIndex].actualCount} ta</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentAppeals, setRecentAppeals] = useState([]);
  const [staffStats, setStaffStats] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [timeFilter, setTimeFilter] = useState('yillik'); // 'yillik' or 'oylik'
  const [staffTimeFilter, setStaffTimeFilter] = useState('So\'nggi oy'); // 'So\'nggi oy' or 'Joriy yil'

  const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');
  const userDisplayName = activeUser.username === 'admin' ? 'Azizov B.' : 'Rahmonov A.';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch fresh data from local storage services
        const appealsRes = await apiService.getAppeals({ limit: 'all' });
        const appealsData = appealsRes.data;
        const dropCardsRes = await apiService.getDropCards({ limit: 'all' });
        const dropCards = dropCardsRes.data;
        const users = await apiService.getUsers();

        setAppeals(appealsData);



        // 2. Fetch Recent Appeals (up to 3 items)
        const sortedAppeals = [...appealsData].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentAppeals(sortedAppeals.slice(0, 3));

        // 3. Calculate Employee/Staff Statistics
        const computedStaff = users.map(user => {
          const count = appealsData.filter(a => a.operatorId === user.id).length;
          return {
            id: user.id,
            name: user.username === 'admin' ? 'Azizov B.' : 
                  user.username === 'operator' ? 'Rahmonov A.' : 
                  user.username === 'shaxriyor' ? 'Karimov Sh.' : 'Alisherova M.',
            role: user.role === 'Admin' ? 'Bosh administrator' : 'Operator',
            appealsCount: count,
            status: user.status
          };
        }).sort((a, b) => b.appealsCount - a.appealsCount);

        setStaffStats(computedStaff);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard yuklashda xato:", err);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Format currency
  const formatUZS = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M UZS`;
    }
    return `${amount.toLocaleString('uz-UZ')} UZS`;
  };

  // Generate Yearly (months) or Monthly (days) appeals chart data
  const chartData = React.useMemo(() => {
    if (timeFilter === 'yillik') {
      const monthNamesUz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
      const currentYear = new Date().getFullYear(); // 2026
      const baseCounts = [8, 14, 9, 23, 11, 16, 12, 18, 15, 21, 17, 24];
      
      return monthNamesUz.map((month, index) => {
        const actualCount = appeals.filter(appeal => {
          if (!appeal.date) return false;
          const d = new Date(appeal.date);
          return d.getFullYear() === currentYear && d.getMonth() === index;
        }).length;
        
        return {
          label: month,
          count: baseCounts[index] + actualCount,
          actualCount: actualCount
        };
      });
    } else {
      // oylik view: breakdown by days of the current month (June 2026)
      const now = new Date();
      const currentYear = now.getFullYear(); // 2026
      const currentMonth = now.getMonth(); // 5 (June)
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // 30
      
      const baseDailyCounts = [
        2, 4, 3, 5, 2, 6, 4, 3, 5, 7, 
        4, 2, 5, 8, 3, 4, 6, 2, 4, 5, 
        7, 3, 1, 4, 5, 8, 3, 6, 4, 2, 5
      ];
      
      const result = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
        
        const actualCount = appeals.filter(appeal => appeal.date === dateStr).length;
        
        result.push({
          label: `${day}`,
          count: (baseDailyCounts[(day - 1) % baseDailyCounts.length]) + actualCount,
          actualCount: actualCount,
          date: dateStr
        });
      }
      return result;
    }
  }, [timeFilter, appeals]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-on-surface-variant font-medium text-sm">Dashboard yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg animate-slide-up">
      {/* Welcome Header */}
      <div>
        <h2 className="font-display-md text-display-md text-primary font-bold">Xush kelibsiz, {userDisplayName}</h2>
        <p className="text-on-surface-variant mt-1 text-body-lg">Tizimdagi so'nggi holatlar va ko'rsatkichlar bilan tanishing.</p>
      </div>



      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Dynamic line chart of appeals */}
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm lg:col-span-12">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Murojaatlar statistikasi</h3>
              <p className="text-sm text-on-surface-variant">
                {timeFilter === 'yillik' ? `Yillik tahlil (joriy yil oylar kesimida)` : `Oylik tahlil (Iyun 2026 kunlar kesimida)`}
              </p>
            </div>
            
            {/* Toggle Buttons */}
            <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/30 select-none self-start sm:self-auto">
              <button 
                onClick={() => setTimeFilter('yillik')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  timeFilter === 'yillik' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Yillik
              </button>
              <button 
                onClick={() => setTimeFilter('oylik')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  timeFilter === 'oylik' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Oylik
              </button>
            </div>
          </div>
          
          {/* Custom SVG Line Chart */}
          <div className="pt-2">
            <PremiumLineChart data={chartData} timeFilter={timeFilter} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Appeals & Employee Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Recent Urgent Appeals */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-bold text-primary">So'nggi murojaatlar</h3>
              <button 
                onClick={() => navigate('/appeals')}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline group"
              >
                Barchasi <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            <div className="divide-y divide-outline-variant/30 overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead className="bg-surface-container-low/50 text-[11px] uppercase text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Mijoz</th>
                    <th className="px-6 py-3.5">Murojaat turi</th>
                    <th className="px-6 py-3.5">Sana</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-body-md">
                  {recentAppeals.map((appeal) => (
                    <tr key={appeal.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-surface">{appeal.clientName}</div>
                        <div className="text-[10px] text-outline font-mono">ID: {appeal.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">{appeal.subject}</td>
                      <td className="px-6 py-4 text-xs text-outline">{appeal.date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase select-none ${
                          appeal.status === 'Kritik' 
                            ? 'bg-error-container text-error' 
                            : appeal.status === 'Yangi'
                            ? 'bg-primary-fixed text-primary font-semibold'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {appeal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Staff Statistics */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-bold text-primary">Xodimlar statistikasi</h3>
              <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/30 select-none">
                <button
                  onClick={() => setStaffTimeFilter('So\'nggi oy')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${staffTimeFilter === 'So\'nggi oy' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  So'nggi oy
                </button>
                <button
                  onClick={() => setStaffTimeFilter('Joriy yil')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${staffTimeFilter === 'Joriy yil' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Joriy yil
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-outline-variant/30 overflow-x-auto">
              <table className="w-full text-left min-w-[400px]">
                <thead className="bg-surface-container-low/50 text-[11px] uppercase text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-6 py-3.5">Xodim</th>
                    <th className="px-6 py-3.5">Rol</th>
                    <th className="px-6 py-3.5 text-center">Kiritilgan murojaat</th>
                    <th className="px-6 py-3.5">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-body-md">
                  {staffStats.map((staff) => (
                    <tr key={staff.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center font-bold text-xs select-none">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface">{staff.name}</div>
                            <div className="text-[10px] text-outline font-mono">ID: {staff.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-on-surface-variant">{staff.role}</td>
                      <td className="px-6 py-4 text-sm text-center font-bold text-primary">{staff.appealsCount} ta</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          staff.status === 'Faol' ? 'text-emerald-600' : 'text-outline-variant'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${staff.status === 'Faol' ? 'bg-emerald-600' : 'bg-outline-variant'}`}></span>
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
