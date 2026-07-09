import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  type ChartConfiguration,
} from 'chart.js';
import { Button } from '@/components/ui/Button';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import {
  apiGetDashboard,
  apiGetDashboardCouponChart,
  apiGetDashboardMemberChart,
  apiGetDashboardOrderChart,
  apiGetDashboardSalesChart,
  type ApiError,
  type DashboardCouponChartItem,
  type DashboardData,
  type DashboardMemberChartItem,
  type DashboardOrderChartItem,
  type DashboardSalesChartItem,
} from '@/lib/api';

Chart.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatCurrency(value: number) {
  return `₩${value.toLocaleString()}`;
}

function toShortDate(value: string) {
  return value.slice(5).replace('-', '.');
}

type DashboardChartState = {
  members: DashboardMemberChartItem[];
  orders: DashboardOrderChartItem[];
  sales: DashboardSalesChartItem[];
  coupons: DashboardCouponChartItem[];
};

const initialChartState: DashboardChartState = {
  members: [],
  orders: [],
  sales: [],
  coupons: [],
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminSession, accessToken } = useAdminAuthStore();
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateInput(addDays(today, -6)));
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<DashboardChartState>(initialChartState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [chartError, setChartError] = useState('');

  useEffect(() => {
    if (!adminSession?.role || !accessToken) {
      navigate('/admin/login', { replace: true });
      return;
    }
  }, [adminSession, accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    void loadDashboard(startDate, endDate, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function loadDashboard(nextStartDate: string, nextEndDate: string, initial = false) {
    if (!accessToken) return;
    if (nextStartDate > nextEndDate) {
      setError('?? ???? ????? ?? ? ????.');
      return;
    }

    if (initial) {
      setLoading(true);
    } else {
      setSubmitting(true);
    }
    setError('');
    setChartError('');

    try {
      const params = { startDate: nextStartDate, endDate: nextEndDate };
      const summaryData = await apiGetDashboard(accessToken);
      setSummary(summaryData);

      const [membersResult, ordersResult, salesResult, couponsResult] = await Promise.allSettled([
        apiGetDashboardMemberChart(accessToken, params),
        apiGetDashboardOrderChart(accessToken, params),
        apiGetDashboardSalesChart(accessToken, params),
        apiGetDashboardCouponChart(accessToken, params),
      ]);

      setCharts({
        members: membersResult.status === 'fulfilled' ? membersResult.value.items ?? [] : [],
        orders: ordersResult.status === 'fulfilled' ? ordersResult.value.items ?? [] : [],
        sales: salesResult.status === 'fulfilled' ? salesResult.value.items ?? [] : [],
        coupons: couponsResult.status === 'fulfilled' ? couponsResult.value.items ?? [] : [],
      });

      if (
        membersResult.status === 'rejected' ||
        ordersResult.status === 'rejected' ||
        salesResult.status === 'rejected' ||
        couponsResult.status === 'rejected'
      ) {
        setChartError('?? ?? ???? ???? ?????. ??? ?? API? ??????.');
      }
    } catch (e) {
      const apiError = e as ApiError;
      setError(apiError.message ?? '????? ??? ? ????.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

  if (!adminSession) {
    return <div style={{ padding: 40, textAlign: 'center' }}>리디렉션 중...</div>;
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>대시보드를 불러오는 중...</div>;
  }

  if (!summary) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error || '대시보드 데이터를 불러오지 못했습니다.'}</div>;
  }

  const stats = [
    { label: '오늘 주문 수', value: summary.todayOrderCount.toLocaleString(), path: '/admin/orders' },
    { label: '오늘 매출', value: formatCurrency(summary.todaySalesAmount), path: '/admin/orders' },
    { label: '오늘 신규 회원', value: summary.newMemberCount.toLocaleString(), path: '/admin/members' },
    { label: '재고 부족 상품', value: summary.lowStockProductCount.toLocaleString(), path: '/admin/products', emphasis: summary.lowStockProductCount > 0 },
    { label: '답변 대기 문의', value: summary.pendingQnaCount.toLocaleString(), path: '/admin/qna', emphasis: summary.pendingQnaCount > 0 },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827' }}>대시보드</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          요약 지표와 기간별 추이를 한 화면에서 확인합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {stats.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: item.emphasis ? '#fff7ed' : '#ffffff',
              padding: '18px 18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.emphasis ? '#c2410c' : '#111827' }}>{item.value}</div>
          </button>
        ))}
      </div>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end', justifyContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>기간 조회</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>회원, 주문, 매출, 쿠폰 차트를 같은 기간 기준으로 조회합니다.</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4b5563' }}>시작일</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={dateInputStyle}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4b5563' }}>종료일</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={dateInputStyle}
              />
            </label>
            <Button onClick={() => void loadDashboard(startDate, endDate)} disabled={submitting}>
              {submitting ? '조회 중...' : '조회'}
            </Button>
          </div>
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: '#b91c1c' }}>{error}</div>}
        {chartError && <div style={{ marginTop: 8, fontSize: 13, color: '#b45309' }}>{chartError}</div>}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        <ChartCard
          title="신규 회원가입 추이"
          description="일자별 신규 가입 수"
          config={{
            type: 'line',
            data: {
              labels: charts.members.map((item) => toShortDate(item.date)),
              datasets: [
                {
                  label: '신규 회원',
                  data: charts.members.map((item) => item.count),
                  borderColor: '#f97316',
                  backgroundColor: 'rgba(249, 115, 22, 0.16)',
                  tension: 0.3,
                  fill: true,
                },
              ],
            },
            options: baseChartOptions('명'),
          }}
          empty={charts.members.length === 0}
        />

        <ChartCard
          title="주문 수 추이"
          description="일자별 주문 건수"
          config={{
            type: 'bar',
            data: {
              labels: charts.orders.map((item) => toShortDate(item.date)),
              datasets: [
                {
                  label: '주문 수',
                  data: charts.orders.map((item) => item.count),
                  backgroundColor: '#14b8a6',
                  borderRadius: 6,
                },
              ],
            },
            options: baseChartOptions('건'),
          }}
          empty={charts.orders.length === 0}
        />

        <ChartCard
          title="매출 / 판매수량 추이"
          description="취소·환불 제외 기준"
          config={{
            type: 'bar',
            data: {
              labels: charts.sales.map((item) => toShortDate(item.date)),
              datasets: [
                {
                  type: 'bar',
                  label: '매출액',
                  data: charts.sales.map((item) => item.salesAmount),
                  backgroundColor: 'rgba(37, 99, 235, 0.24)',
                  borderColor: '#2563eb',
                  borderWidth: 1,
                  borderRadius: 6,
                  yAxisID: 'y',
                },
                {
                  type: 'line',
                  label: '판매수량',
                  data: charts.sales.map((item) => item.soldQuantity),
                  borderColor: '#ef4444',
                  backgroundColor: '#ef4444',
                  borderWidth: 3,
                  pointRadius: 3,
                  pointHoverRadius: 4,
                  tension: 0.3,
                  yAxisID: 'y1',
                },
              ],
            },
            options: salesChartOptions(),
          }}
          empty={charts.sales.length === 0}
        />

        <ChartCard
          title="쿠폰 발급 / 사용 추이"
          description="일자별 발급 건수와 사용 건수"
          config={{
            type: 'line',
            data: {
              labels: charts.coupons.map((item) => toShortDate(item.date)),
              datasets: [
                {
                  label: '발급',
                  data: charts.coupons.map((item) => item.issuedCount),
                  borderColor: '#8b5cf6',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  tension: 0.3,
                  fill: true,
                },
                {
                  label: '사용',
                  data: charts.coupons.map((item) => item.usedCount),
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  tension: 0.3,
                  fill: true,
                },
              ],
            },
            options: baseChartOptions('건'),
          }}
          empty={charts.coupons.length === 0}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  config,
  empty,
}: {
  title: string;
  description: string;
  config: ChartConfiguration;
  empty: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || empty) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config, empty]);

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{title}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{description}</div>
      </div>
      <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {empty ? (
          <div style={{ fontSize: 13, color: '#9ca3af' }}>조회된 데이터가 없습니다.</div>
        ) : (
          <canvas ref={canvasRef} height={280} />
        )}
      </div>
    </section>
  );
}

function baseChartOptions(unit: string): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4b5563',
          font: { size: 12, family: 'sans-serif' },
        },
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        callbacks: {
          label(context) {
            const value = typeof context.parsed.y === 'number' ? context.parsed.y.toLocaleString() : '0';
            return `${context.dataset.label ?? ''}: ${value}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#6b7280' },
        grid: { color: '#f3f4f6' },
      },
    },
  };
}

function salesChartOptions(): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4b5563',
          font: { size: 12, family: 'sans-serif' },
        },
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        callbacks: {
          label(context) {
            const value = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
            if (context.dataset.label === '매출액') {
              return `매출액: ${formatCurrency(value)}`;
            }
            return `판매수량: ${value.toLocaleString()}개`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6b7280',
          callback(value) {
            return formatCurrency(Number(value));
          },
        },
        grid: { color: '#dbe3ee' },
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        ticks: {
          color: '#6b7280',
          callback(value) {
            return `${Number(value).toLocaleString()}개`;
          },
        },
        grid: { color: 'rgba(239, 68, 68, 0.10)', drawOnChartArea: false },
      },
    },
  };
}

const dateInputStyle: React.CSSProperties = {
  height: 40,
  minWidth: 150,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  color: '#111827',
  background: '#fff',
};
