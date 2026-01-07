import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const { token } = useAuth();
  const [timeFilter, setTimeFilter] = useState('7days');
  const [soldCoursesMonth, setSoldCoursesMonth] = useState('December');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [soldCoursesDisplayCount, setSoldCoursesDisplayCount] = useState('10');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  const monthPickerRef = useRef(null);
  const categoryPickerRef = useRef(null);
  const yearPickerRef = useRef(null);

  const [overview, setOverview] = useState({
    totalRevenue: { amount: 0, percentageChange: 0, trend: 'up' },
    totalRegistrations: { count: 0, percentageChange: 0, trend: 'up' },
    totalCourses: { count: 0, percentageChange: 0, trend: 'up' },
  });
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [availableYears, setAvailableYears] = useState(['2025']);
  const [soldCoursesData, setSoldCoursesData] = useState({});
  const [courseCategoryData, setCourseCategoryData] = useState([]);
  const [lessonDistributionData, setLessonDistributionData] = useState({});
  const [categories, setCategories] = useState([{ value: 'all', label: 'All Categories' }]);
  const [availableMonths, setAvailableMonths] = useState(['December']);
  const [totalSubscribedUsers, setTotalSubscribedUsers] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setShowMonthPicker(false);
      }
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target)) {
        setShowCategoryPicker(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target)) {
        setShowYearPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch API data
  useEffect(() => {
    if (token) {
      const fetchData = async () => {
        try {
          const response = await fetch('https://api.hearingzen.in/api/analytics/dashboard', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const res = await response.json();
          if (res.success) {
            const data = res.data;
            
            // Set overview data
            setOverview(data.overview);
            
            // Set revenue chart data
            setRevenueChartData(data.revenueOverview.chartData);
            
            // Extract available years from revenue data
            const years = [...new Set(data.revenueOverview.chartData.map(d => d.year.toString()))].sort((a, b) => a - b);
            setAvailableYears(years);
            if (!years.includes(selectedYear)) {
              setSelectedYear(years[years.length - 1]);
            }
            
            // Set sold courses data
            setSoldCoursesData(data.soldCoursesData);
            
            // Set available months from sold courses data
            const months = Object.keys(data.soldCoursesData).filter(key => data.soldCoursesData[key].length > 0);
            setAvailableMonths(months);
            if (months.length > 0 && !months.includes(soldCoursesMonth)) {
              setSoldCoursesMonth(months[months.length - 1]);
            }
            
            // Set course category data
            setCourseCategoryData(data.courseCategoryData);
            
            // Set lesson distribution data
            setLessonDistributionData(data.lessonDistributionData);
            
            // Build categories list from API data
            const apiCategories = data.categories.map(cat => ({
              value: cat.id,
              label: cat.name
            }));
            setCategories([{ value: 'all', label: 'All Categories' }, ...apiCategories]);
            
            // Calculate total subscribed users from lesson distribution
            let totalSubs = 0;
            Object.values(data.lessonDistributionData).forEach(categoryLessons => {
              categoryLessons.forEach(lesson => {
                totalSubs += lesson.subscribers || 0;
              });
            });
            setTotalSubscribedUsers(totalSubs);
            
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      };
      fetchData();
    }
  }, [token]);

  const getFormattedRevenueData = () => {
    return revenueChartData
      .filter(item => item.year === parseInt(selectedYear))
      .map(item => ({
        month: item.month,
        revenue: item.revenue
      }));
  };

  const getCurrentPieData = () => {
    if (selectedCategory === 'all') {
      return courseCategoryData;
    }
    
    // Find the category data by ID
    const categoryData = lessonDistributionData[selectedCategory];
    if (categoryData) {
      return categoryData;
    }
    
    // Fallback: try to find by name
    const categoryName = categories.find(cat => cat.value === selectedCategory)?.label;
    if (categoryName && lessonDistributionData[categoryName]) {
      return lessonDistributionData[categoryName];
    }
    
    return [];
  };

  const getChartSubtitle = () => {
    if (selectedCategory === 'all') {
      return 'By category';
    }
    const categoryLabel = categories.find(cat => cat.value === selectedCategory)?.label;
    return `Lessons in ${categoryLabel || selectedCategory}`;
  };

  const getSoldCoursesData = () => {
    const data = soldCoursesData[soldCoursesMonth] || [];
    if (soldCoursesDisplayCount === 'all') {
      return data;
    }
    return data.slice(0, parseInt(soldCoursesDisplayCount));
  };

  const handlePieClick = (entry, index) => {
    setActivePieIndex(activePieIndex === index ? null : index);
  };

  const handleChartClick = (e) => {
    const clickedElement = e.target;
    const isWrapper = clickedElement.classList.contains('recharts-wrapper') || 
                      clickedElement.classList.contains('recharts-surface') ||
                      clickedElement.tagName === 'svg';
    
    if (isWrapper) {
      setActivePieIndex(null);
    }
  };

  return (
    <div className="dashboard-container" onClick={(e) => {
      const pieChartWrapper = e.target.closest('.pie-chart');
      if (!pieChartWrapper) {
        setActivePieIndex(null);
      }
    }}>
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard Overview
            </h2>
            <p className="page-subtitle">Welcome back! Here's a quick snapshot of your LMS activity today.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <p className="stat-label">Total Revenue</p>
                <h3 className="stat-value">₹{overview.totalRevenue.amount.toLocaleString()}</h3>
              </div>
              <div className="stat-icon revenue-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className={`badge-${overview.totalRevenue.trend === 'up' ? 'success' : 'danger'}`}>
                <i className={`bi bi-arrow-${overview.totalRevenue.trend}`}></i>{overview.totalRevenue.percentageChange}%
              </span>
              <span className="stat-comparison">vs last month</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <p className="stat-label">Total Registrations</p>
                <h3 className="stat-value">{overview.totalRegistrations.count.toLocaleString()}</h3>
              </div>
              <div className="stat-icon registration-icon">
                <i className="bi bi-people"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className={`badge-${overview.totalRegistrations.trend === 'up' ? 'success' : 'danger'}`}>
                <i className={`bi bi-arrow-${overview.totalRegistrations.trend}`}></i>{overview.totalRegistrations.percentageChange}%
              </span>
              <span className="stat-comparison">vs last month</span>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <p className="stat-label">Total Courses</p>
                <h3 className="stat-value">{overview.totalCourses.count.toLocaleString()}</h3>
              </div>
              <div className="stat-icon courses-icon">
                <i className="bi bi-book"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className={`badge-${overview.totalCourses.trend === 'up' ? 'success' : 'danger'}`}>
                <i className={`bi bi-arrow-${overview.totalCourses.trend}`}></i>{overview.totalCourses.percentageChange}%
              </span>
              <span className="stat-comparison">vs last month</span>
            </div>
          </div>
        </div>
        {/* <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <p className="stat-label">Total Subscribed Users</p>
                <h3 className="stat-value">{totalSubscribedUsers.toLocaleString()}</h3>
              </div>
              <div className="stat-icon rate-icon">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className="badge-success">
                <i className="bi bi-arrow-up"></i>+ 0
              </span>
              <span className="stat-comparison">vs last month</span>
            </div>
          </div>
        </div> */}
      </div>

      <div className="charts-grid">
        <div className="chart-card revenue-chart">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">Revenue Overview</h5>
              <p className="chart-subtitle">Monthly revenue for {selectedYear}</p>
            </div>
            <div className="year-selector-container" ref={yearPickerRef}>
              <button 
                className="year-selector-btn"
                onClick={() => setShowYearPicker(!showYearPicker)}
              >
                <i className="bi bi-calendar3"></i>
                <span>{selectedYear}</span>
                <i className={`bi bi-chevron-${showYearPicker ? 'up' : 'down'}`}></i>
              </button>
              {showYearPicker && (
                <div className="year-dropdown">
                  {availableYears.map(year => (
                    <button
                      key={year}
                      className={`year-option ${year === selectedYear ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="chart-wrapper revenue-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getFormattedRevenueData()} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  style={{ fontSize: '10px' }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  style={{ fontSize: '12px' }}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card pie-chart" onClick={(e) => e.stopPropagation()}>
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">Course Distribution</h5>
              <p className="chart-subtitle">{getChartSubtitle()}</p>
            </div>
            <div className="category-selector-container" ref={categoryPickerRef}>
              <button 
                className="category-selector-btn"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <i className="bi bi-funnel"></i>
                <span>{categories.find(cat => cat.value === selectedCategory)?.label}</span>
                <i className={`bi bi-chevron-${showCategoryPicker ? 'up' : 'down'}`}></i>
              </button>
              {showCategoryPicker && (
                <div className="category-dropdown">
                  {categories.map(category => (
                    <button
                      key={category.value}
                      className={`category-option ${category.value === selectedCategory ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(category.value);
                        setShowCategoryPicker(false);
                        setActivePieIndex(null);
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="chart-wrapper" onClick={handleChartClick} style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart onClick={(e) => {
                if (e && e.target && e.target.tagName === 'svg') {
                  setActivePieIndex(null);
                }
              }}>
                <Pie
                  data={getCurrentPieData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                  labelLine={{ stroke: '#94a3b8', strokeDasharray: '3 3', strokeWidth: 1 }}
                  animationBegin={0}
                  animationDuration={400}
                  isAnimationActive={true}
                >
                  {getCurrentPieData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={activePieIndex === null ? 1 : activePieIndex === index ? 1 : 0.3}
                      stroke="none"
                      style={{ cursor: 'pointer', outline: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePieClick(entry, index);
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      
                      if (selectedCategory !== 'all' && data.author && data.subscribers !== undefined) {
                        return (
                          <div style={{
                            background: 'white',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{
                              margin: '0 0 8px 0',
                              fontWeight: '600',
                              fontSize: '14px',
                              color: '#1e293b'
                            }}>
                              {data.name}
                            </p>
                            <div style={{
                              borderTop: '1px solid #e2e8f0',
                              paddingTop: '8px'
                            }}>
                              <div style={{
                                margin: '0 0 4px 0',
                                fontSize: '13px',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ fontWeight: '500', color: '#475569' }}>Lessons:</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{data.value}</span>
                              </div>
                              <div style={{
                                margin: '0 0 4px 0',
                                fontSize: '13px',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ fontWeight: '500', color: '#475569' }}>Author:</span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{data.author}</span>
                              </div>
                              <div style={{
                                margin: '0',
                                fontSize: '13px',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span style={{ fontWeight: '500', color: '#475569' }}>Subscribers:</span>
                                <span style={{ 
                                  fontWeight: '600', 
                                  color: '#16a34a',
                                  background: '#dcfce7',
                                  padding: '2px 8px',
                                  borderRadius: '4px'
                                }}>
                                  {data.subscribers.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div style={{
                          background: 'white',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '1px solid #e2e8f0'
                        }}>
                          <p style={{
                            margin: '0',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#1e293b'
                          }}>
                            {data.name}: {data.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {getCurrentPieData().map((item, index) => (
              <div key={index} className="pie-legend-item">
                <div className="pie-legend-left">
                  <div
                    className="pie-legend-color"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="registration-chart-container">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">Top Sold Courses</h5>
              <p className="chart-subtitle">
                Courses sold in {soldCoursesMonth} 
                {soldCoursesDisplayCount === 'all' 
                  ? ' (All Courses)' 
                  : ` (Top ${soldCoursesDisplayCount})`}
              </p>
            </div>
            <div className="registration-filter-container">
              <select 
                className="form-select registration-time-filter sold-courses-filter"
                value={soldCoursesDisplayCount}
                onChange={(e) => setSoldCoursesDisplayCount(e.target.value)}
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="all">All Courses</option>
              </select>
              <div className="year-selector-container" ref={monthPickerRef}>
                <button 
                  className="year-selector-btn month-selector-btn"
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                >
                  <i className="bi bi-calendar-month"></i>
                  <span>{soldCoursesMonth}</span>
                  <i className={`bi bi-chevron-${showMonthPicker ? 'up' : 'down'}`}></i>
                </button>
                {showMonthPicker && (
                  <div className="year-dropdown month-dropdown">
                    {availableMonths.map(month => (
                      <button
                        key={month}
                        className={`year-option ${month === soldCoursesMonth ? 'active' : ''}`}
                        onClick={() => {
                          setSoldCoursesMonth(month);
                          setShowMonthPicker(false);
                        }}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="chart-wrapper registration-chart-wrapper sold-courses-chart-wrapper">
            <ResponsiveContainer width="100%" height={Math.max(350, (soldCoursesDisplayCount === 'all' ? getSoldCoursesData().length : parseInt(soldCoursesDisplayCount)) * 40)}>
              <BarChart 
                data={getSoldCoursesData()} 
                layout="vertical"
                margin={{ top: 10, right: 20, left: windowWidth < 768 ? 0 : 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  stroke="#94a3b8" 
                  style={{ fontSize: windowWidth < 768 ? '10px' : '12px' }}
                />
                <YAxis 
                  type="category"
                  dataKey="courseName" 
                  stroke="#94a3b8" 
                  width={windowWidth < 768 ? 105 : 170}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const isMobile = windowWidth < 768;
                    const maxLength = isMobile ? 13 : 20;
                    const text = payload.value.length > maxLength 
                      ? payload.value.substring(0, maxLength) + '...' 
                      : payload.value;
                    return (
                      <text 
                        x={isMobile ? x - 2 : x - 10} 
                        y={y} 
                        textAnchor="end" 
                        fill="#94a3b8" 
                        fontSize={isMobile ? '8px' : '10px'}
                        dy={4}
                      >
                        {text}
                      </text>
                    );
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="sold-courses-tooltip">
                          <p className="sold-courses-tooltip-title">
                            {data.courseName}
                          </p>
                          <div className="sold-courses-tooltip-content">
                            <div className="sold-courses-tooltip-item">
                              <span className="sold-courses-tooltip-label">Sold:</span>
                              <span className="sold-courses-tooltip-value">{data.sold} courses</span>
                            </div>
                            <div className="sold-courses-tooltip-item">
                              <span className="sold-courses-tooltip-label">Revenue:</span>
                              <span className="sold-courses-tooltip-revenue">
                                ₹{data.revenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="sold" 
                  fill="#4f46e5"
                  radius={[0, 8, 8, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;