/**
 * LUCIA FINANCE - Lightweight Canvas Charting Engine
 * Zero dependencies, high-DPI crisp rendering, premium dark/gold theme.
 */

const LuciaCharts = {
  // Render Financial Bar Chart (Income vs Expense vs Net Profit)
  renderFinancialBars(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width || 360;
    const height = rect.height || canvas.height || 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const items = [
      { label: 'Income', value: Math.max(0, data.income || 0), color: '#10B981', gradient: ['#10B981', '#059669'] },
      { label: 'Expenses', value: Math.max(0, data.expenses || 0), color: '#EF4444', gradient: ['#F87171', '#DC2626'] },
      { label: 'Salaries', value: Math.max(0, data.salaries || 0), color: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'] },
      { label: 'Net Profit', value: Math.max(0, data.netProfit || 0), color: '#D4AF37', gradient: ['#F5D77F', '#B38B1C'] }
    ];

    const maxValue = Math.max(...items.map(i => i.value), 10000) * 1.15;
    const padding = { top: 30, bottom: 40, left: 20, right: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barWidth = Math.min(48, (chartWidth / items.length) * 0.6);
    const spacing = chartWidth / items.length;

    // Draw baseline
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    items.forEach((item, index) => {
      const x = padding.left + (index * spacing) + (spacing - barWidth) / 2;
      const barHeight = Math.max(4, (item.value / maxValue) * chartHeight);
      const y = height - padding.bottom - barHeight;

      // Create gradient fill
      const grad = ctx.createLinearGradient(0, y, 0, height - padding.bottom);
      grad.addColorStop(0, item.gradient[0]);
      grad.addColorStop(1, item.gradient[1]);

      // Draw rounded bar
      const radius = 6;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, height - padding.bottom);
      ctx.lineTo(x, height - padding.bottom);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // Top value text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const shortVal = item.value >= 100000 
        ? `₹${(item.value / 100000).toFixed(1)}L` 
        : `₹${Math.round(item.value / 1000)}k`;
      ctx.fillText(shortVal, x + barWidth / 2, y - 8);

      // Label below bar
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.label, x + barWidth / 2, height - padding.bottom + 18);
    });
  },

  // Render Category Expense Breakdown Donut Chart
  renderCategoryDonut(canvasId, expenses = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width || 360;
    const height = rect.height || canvas.height || 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Group by category
    const categoryTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);

    if (total === 0 || entries.length === 0) {
      ctx.fillStyle = '#71717A';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No expenses recorded for this period', width / 2, height / 2);
      return;
    }

    const colors = [
      '#D4AF37', // Gold
      '#60A5FA', // Blue
      '#F472B6', // Pink
      '#34D399', // Emerald
      '#A78BFA', // Violet
      '#FBBF24', // Amber
      '#9CA3AF'  // Gray
    ];

    const centerX = width * 0.35;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 15;
    const innerRadius = outerRadius * 0.62;

    let currentAngle = -Math.PI / 2;

    entries.forEach(([cat, val], index) => {
      const sliceAngle = (val / total) * (Math.PI * 2);
      const color = colors[index % colors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      currentAngle += sliceAngle;
    });

    // Center total text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Total', centerX, centerY - 6);
    ctx.fillStyle = '#D4AF37';
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`₹${(total / 1000).toFixed(0)}k`, centerX, centerY + 12);

    // Legend on the right side
    const legendX = width * 0.65;
    let legendY = 30;
    const topEntries = entries.slice(0, 5);

    topEntries.forEach(([cat, val], idx) => {
      const color = colors[idx % colors.length];
      const pct = Math.round((val / total) * 100);

      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = '#E5E7EB';
      ctx.font = '500 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${cat} (${pct}%)`, legendX + 12, legendY + 4);

      legendY += 24;
    });
  }
};

window.LuciaCharts = LuciaCharts;
