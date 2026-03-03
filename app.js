/* ===================================================================
   WebAnalytics Dashboard – app.js
   Interactive traffic dashboard using Chart.js
   =================================================================== */

(() => {
  'use strict';

  // ───── Configuration ─────
  const COLORS = {
    organic:  { main: '#00bcd4', light: 'rgba(0,188,212,0.18)' },
    direct:   { main: '#4caf50', light: 'rgba(76,175,80,0.18)' },
    referral: { main: '#ffc107', light: 'rgba(255,193,7,0.18)' },
    social:   { main: '#e91e63', light: 'rgba(233,30,99,0.18)' },
  };

  const SOURCE_LABELS = ['Organique', 'Direct', 'Referral', 'Social'];
  const SOURCE_KEYS   = ['organic', 'direct', 'referral', 'social'];

  // ───── DOM Elements ─────
  const els = {
    sidebar:        document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle:     document.getElementById('menuToggle'),
    periodSelect:   document.getElementById('periodSelect'),
    pageTitle:      document.getElementById('pageTitle'),
    trafficCanvas:  document.getElementById('trafficChart'),
    doughnutCanvas: document.getElementById('doughnutChart'),
    doughnutLegend: document.getElementById('doughnutLegend'),
    tableBody:      document.getElementById('trafficTableBody'),
    navLinks:       document.querySelectorAll('.nav-link'),
    chartBtns:      document.querySelectorAll('.chart-btn'),
    kpi:            {
      organic:  document.getElementById('kpiOrganic'),
      direct:   document.getElementById('kpiDirect'),
      referral: document.getElementById('kpiReferral'),
      social:   document.getElementById('kpiSocial'),
    },
    trend: {
      organic:  document.getElementById('trendOrganic'),
      direct:   document.getElementById('trendDirect'),
      referral: document.getElementById('trendReferral'),
      social:   document.getElementById('trendSocial'),
    },
  };

  // ───── Data Generation ─────
  function generateData(days) {
    const labels = [];
    const data = { organic: [], direct: [], referral: [], social: [] };
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));

      // Simulated traffic with realistic patterns (weekday/weekend variation)
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendFactor = isWeekend ? 0.7 : 1;

      data.organic.push(Math.round((300 + Math.random() * 200 + Math.sin(i * 0.3) * 50) * weekendFactor));
      data.direct.push(Math.round((180 + Math.random() * 120 + Math.cos(i * 0.4) * 30) * weekendFactor));
      data.referral.push(Math.round((100 + Math.random() * 80 + Math.sin(i * 0.2) * 25) * weekendFactor));
      data.social.push(Math.round((80 + Math.random() * 60 + Math.cos(i * 0.5) * 20) * weekendFactor));
    }

    return { labels, data };
  }

  // ───── Helpers ─────
  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  function formatNumber(n) {
    return n.toLocaleString('fr-FR');
  }

  function animateValue(el, target) {
    const duration = 800;
    const start = parseInt(el.textContent.replace(/\s/g, '')) || 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = formatNumber(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // ───── KPI Update ─────
  function updateKPIs(data) {
    SOURCE_KEYS.forEach(key => {
      const total = sum(data[key]);
      animateValue(els.kpi[key], total);

      // Simulate trend (compare first half vs second half)
      const mid = Math.floor(data[key].length / 2);
      const firstHalf = sum(data[key].slice(0, mid));
      const secondHalf = sum(data[key].slice(mid));
      const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1) : 0;

      const trendEl = els.trend[key];
      const isUp = trend >= 0;
      trendEl.textContent = `${isUp ? '+' : ''}${trend}%`;
      trendEl.className = `kpi-trend ${isUp ? 'up' : 'down'}`;
    });
  }

  // ───── Table Update ─────
  function updateTable(data) {
    const totals = SOURCE_KEYS.map(k => sum(data[k]));
    const grandTotal = sum(totals);

    els.tableBody.innerHTML = SOURCE_KEYS.map((key, i) => {
      const pct = grandTotal > 0 ? (totals[i] / grandTotal * 100).toFixed(1) : 0;
      const mid = Math.floor(data[key].length / 2);
      const firstHalf = sum(data[key].slice(0, mid));
      const secondHalf = sum(data[key].slice(mid));
      const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1) : 0;
      const isUp = trend >= 0;

      return `
        <tr>
          <td>
            <span class="source-badge">
              <span class="source-dot" style="background:${COLORS[key].main}"></span>
              ${SOURCE_LABELS[i]}
            </span>
          </td>
          <td>${formatNumber(totals[i])}</td>
          <td>${pct}%</td>
          <td>
            <div class="trend-bar-container">
              <div class="trend-bar" style="width:${pct}%;background:${COLORS[key].main};"></div>
              <span class="kpi-trend ${isUp ? 'up' : 'down'}" style="font-size:0.78rem;">
                ${isUp ? '+' : ''}${trend}%
              </span>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // ───── Charts ─────
  let trafficChart = null;
  let doughnutChart = null;
  let currentChartType = 'line';

  function createDatasets(data, type) {
    return SOURCE_KEYS.map((key, i) => ({
      label: SOURCE_LABELS[i],
      data: data[key],
      borderColor: COLORS[key].main,
      backgroundColor: type === 'line' ? COLORS[key].light : COLORS[key].main,
      borderWidth: type === 'line' ? 2.5 : 0,
      pointRadius: type === 'line' ? 0 : undefined,
      pointHoverRadius: type === 'line' ? 6 : undefined,
      pointHoverBackgroundColor: COLORS[key].main,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      fill: type === 'line',
      tension: 0.4,
      borderRadius: type === 'bar' ? 6 : undefined,
      barPercentage: 0.7,
      categoryPercentage: 0.8,
    }));
  }

  const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#8899aa',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, weight: '500' },
        },
      },
      tooltip: {
        backgroundColor: '#1e3548',
        titleColor: '#e8edf2',
        bodyColor: '#8899aa',
        borderColor: '#1e3a50',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 14,
        titleFont: { weight: '600' },
        bodySpacing: 6,
        callbacks: {
          label: ctx => `  ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)} visites`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30,58,80,0.3)', drawBorder: false },
        ticks: {
          color: '#5a6f80',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 15,
        },
      },
      y: {
        grid: { color: 'rgba(30,58,80,0.3)', drawBorder: false },
        ticks: {
          color: '#5a6f80',
          font: { size: 11 },
          callback: v => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v,
        },
        beginAtZero: true,
      },
    },
  };

  function buildTrafficChart(labels, data, type) {
    const ctx = els.trafficCanvas.getContext('2d');

    // Set canvas container height
    els.trafficCanvas.parentElement.style.minHeight = '380px';
    els.trafficCanvas.style.height = '300px';

    if (trafficChart) trafficChart.destroy();

    trafficChart = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: createDatasets(data, type),
      },
      options: chartBaseOptions,
    });
  }

  function buildDoughnutChart(data) {
    const ctx = els.doughnutCanvas.getContext('2d');
    const totals = SOURCE_KEYS.map(k => sum(data[k]));
    const grandTotal = sum(totals);

    if (doughnutChart) doughnutChart.destroy();

    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: SOURCE_LABELS,
        datasets: [{
          data: totals,
          backgroundColor: SOURCE_KEYS.map(k => COLORS[k].main),
          borderColor: '#172a3a',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e3548',
            titleColor: '#e8edf2',
            bodyColor: '#8899aa',
            borderColor: '#1e3a50',
            borderWidth: 1,
            cornerRadius: 10,
            padding: 14,
            callbacks: {
              label: ctx => {
                const pct = grandTotal > 0 ? (ctx.parsed / grandTotal * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${formatNumber(ctx.parsed)} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    // Build custom legend
    els.doughnutLegend.innerHTML = SOURCE_KEYS.map((key, i) => {
      const pct = grandTotal > 0 ? (totals[i] / grandTotal * 100).toFixed(1) : 0;
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${COLORS[key].main}"></span>
          <span>${SOURCE_LABELS[i]} – ${pct}%</span>
        </div>`;
    }).join('');
  }

  // ───── Refresh Everything ─────
  function refresh() {
    const days = parseInt(els.periodSelect.value);
    const { labels, data } = generateData(days);

    updateKPIs(data);
    updateTable(data);
    buildTrafficChart(labels, data, currentChartType);
    buildDoughnutChart(data);
  }

  // ───── Event Listeners ─────

  // Period selector
  els.periodSelect.addEventListener('change', refresh);

  // Chart type toggle
  els.chartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.chartBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.dataset.type;
      refresh();
    });
  });

  // Sidebar navigation
  els.navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      els.navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const sectionNames = {
        'overview':        'Vue d\'ensemble',
        'traffic':         'Trafic',
        'keywords':        'Mots-clés',
        'pages':           'Pages',
        'search-console':  'Console de Recherche',
        'ai-insights':     'IA Insights',
      };

      els.pageTitle.textContent = sectionNames[link.dataset.section] || 'Vue d\'ensemble';

      // Close mobile sidebar after navigation
      closeSidebar();

      // Re-generate data when switching sections
      refresh();
    });
  });

  // Mobile sidebar
  function openSidebar() {
    els.sidebar.classList.add('open');
    els.sidebarOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    els.sidebar.classList.remove('open');
    els.sidebarOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  els.menuToggle.addEventListener('click', () => {
    els.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  els.sidebarOverlay.addEventListener('click', closeSidebar);

  // Keyboard accessibility – close sidebar with Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ───── Init ─────
  refresh();

})();
