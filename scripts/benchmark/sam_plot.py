#!/usr/bin/env python3
"""
SAM 验证数据可视化 — 通过 ctypes 调用 C++ DLL 获取数据并画图

用法:
  python sam_plot.py [output_dir]

依赖: pip install matplotlib numpy
"""
import json
import sys
import os
import ctypes
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.axes_grid1.inset_locator import inset_axes

# ── 加载 DLL ──────────────────────────────────
_dll_dir = os.path.dirname(os.path.abspath(__file__))
_dll_path = os.path.abspath(os.path.join(_dll_dir, 'sam_compute.dll'))
_sam_dll = ctypes.CDLL(_dll_path)
_sam_dll.sam_compute.restype = ctypes.c_void_p
_sam_dll.sam_free_string.argtypes = [ctypes.c_void_p]


def compute_data():
    """调用 C++ DLL 获取全量实验数据 (JSON string -> dict)"""
    ptr = _sam_dll.sam_compute()
    if not ptr:
        raise RuntimeError('sam_compute() returned NULL')
    raw = ctypes.cast(ptr, ctypes.c_char_p).value
    data = json.loads(raw.decode('utf-8'))
    _sam_dll.sam_free_string(ptr)
    return data


# ── 颜色方案 ──────────────────────────────────
COLORS = {
    'worst':    '#d55e00',
    'same':     '#009e73',
    'cyclic':   '#0072b2',
    'random':   '#cc79a7',
    'array':    '#0072b2',
    'hashmap':  '#009e73',
    'treemap':  '#cc79a7',
    'naive':    '#d55e00',
    'actual':   '#009e73',
    'on':       '#0072b2',
    'on2':      '#d55e00',
}


def plot_part1(data, output_dir='.'):
    cases = data['part1']['cases']
    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    fig.suptitle('SAM: link jumps per insertion', fontsize=16, fontweight='bold')

    cmap = {
        'abbb...c (worst)': COLORS['worst'],
        'aaa... (same char)': COLORS['same'],
        'abc... (cyclic)': COLORS['cyclic'],
        'random': COLORS['random'],
    }

    for ax, (name, cdata) in zip(axes.flat, cases.items()):
        jumps = cdata['jumps']
        n = cdata['n']
        total = cdata['total']
        amortized = cdata['amortized']
        color = cmap.get(name, '#333')

        x = np.arange(1, n + 1)
        ax.bar(x, jumps, alpha=0.5, color=color, width=0.7, label='per insertion', zorder=2)

        ax2 = ax.twinx()
        cumul = np.cumsum(jumps)
        ax2.plot(x, cumul, color='#222', lw=2.0, label='cumulative', zorder=3)
        ax2.plot(x, [amortized * i for i in x],
                 '--', color='gray', lw=1, alpha=0.6,
                 label=f'amortized avg ({amortized:.2f})')

        peak = max(jumps)
        peak_i = jumps.index(peak) + 1
        ax.annotate(f'peak {peak}', xy=(peak_i, peak),
                    xytext=(peak_i + 10, peak * 0.75),
                    arrowprops=dict(arrowstyle='->', color='darkred', lw=1.5),
                    fontsize=10, color='darkred', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='#ffeaa7', alpha=0.9))

        ax.set_title(f'{name}  (n={n}, total={total}, avg={amortized:.2f})', fontsize=11)
        ax.set_xlabel('insertion step')
        ax.set_ylabel('jumps per insertion', color=color)
        ax2.set_ylabel('cumulative jumps', color='#222')
        ax.grid(alpha=0.2)
        l1, ll1 = ax.get_legend_handles_labels()
        l2, ll2 = ax2.get_legend_handles_labels()
        ax.legend(l1 + l2, ll1 + ll2, loc='upper left', fontsize=7.5)

    plt.tight_layout()
    path = f'{output_dir}/sam_jumps.png'
    plt.savefig(path, dpi=150, bbox_inches='tight')
    print(f'[done] {path}')
    plt.close()


def plot_part2(data, output_dir='.'):
    p2 = data['part2']
    sigmas = p2['sigmas']
    sigmas_naive = p2['sigmas_naive']
    n = p2['n']
    times_array   = p2['times_array']
    times_hashmap = p2['times_hashmap']
    times_treemap = p2['times_treemap']
    times_naive   = p2['times_naive']

    naive_idx = [i for i, s in enumerate(sigmas) if s in sigmas_naive]
    naive_max_sigma = sigmas_naive[-1]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle(f'SAM construction time vs alphabet size |S| (n={n})',
                 fontsize=14, fontweight='bold', y=0.98)

    # ─── 左: log-log, 全部实现 + 比值双 y 轴 ───
    ax1.loglog([sigmas[i] for i in naive_idx],
               [times_naive[i] for i in naive_idx],
               'd-', color=COLORS['naive'], lw=2, ms=6,
               label=f'naive array (O(n|S|), max |S|={naive_max_sigma})')
    ax1.loglog(sigmas, times_treemap,
               '^-', color=COLORS['treemap'], lw=2, ms=6,
               label='tree map (std::map, O(log|S|))')
    ax1.loglog(sigmas, times_hashmap,
               's-', color=COLORS['hashmap'], lw=2, ms=6,
               label='hash map (std::unordered_map, O(1))')
    ax1.loglog(sigmas, times_array,
               'o-', color=COLORS['array'], lw=1.5, ms=5, alpha=0.6,
               label='fixed array (|S|=26, baseline)')

    ax1.set_xlabel('alphabet size |S|')
    ax1.set_ylabel('time (s)')
    ax1.set_title(f'SAM: sigma 26 to {sigmas[-1]:,}', fontsize=12)

    # 右侧 y 轴: treemap/hashmap 比值, 展示 O(log|S|) 趋势
    ax1b = ax1.twinx()
    ratios = [times_treemap[i] / times_hashmap[i] for i in range(len(sigmas))]
    ax1b.loglog(sigmas, ratios, ':', color='#e74c3c', lw=2, alpha=0.8,
                label='treemap/hashmap ratio')
    ax1b.set_ylabel('treemap / hashmap ratio', color='#e74c3c')
    ax1b.tick_params(axis='y', labelcolor='#e74c3c')
    ax1b.axhline(y=1.0, color='#e74c3c', lw=0.5, ls='--', alpha=0.4)
    ax1b.set_ylim(0.5, max(ratios) * 1.5)

    # 合并图例
    l1, ll1 = ax1.get_legend_handles_labels()
    l2, ll2 = ax1b.get_legend_handles_labels()
    ax1.legend(l1 + l2, ll1 + ll2, fontsize=8, loc='upper left')

    ax1.grid(alpha=0.3, which='both')

    # ─── 右: 柱状对比, 对数 y ───
    # 找 naive 在 |S|=5000 的值
    ni = next((i for i, s in enumerate(sigmas) if s == naive_max_sigma), -1)
    hline_label = None
    if ni >= 0:
        hline_label = (f'naive array at |S|={naive_max_sigma}\n({times_naive[ni]:.4f}s)',
                       times_naive[ni])

    bar_labels = ['fixed array\n(|S|=26)', 'hash map', 'tree map', f'naive array\n(|S|={naive_max_sigma})']
    bar_values = [times_array[-1], times_hashmap[-1], times_treemap[-1],
                  times_naive[ni] if ni >= 0 else 0]
    bar_colors = [COLORS['array'], COLORS['hashmap'], COLORS['treemap'], COLORS['naive']]
    bars = ax2.bar(bar_labels, bar_values, color=bar_colors, alpha=0.7, width=0.5)
    for bar, v in zip(bars, bar_values):
        ax2.text(bar.get_x() + bar.get_width() / 2, v * 1.1,
                 f'{v:.4f}s', ha='center', va='bottom', fontsize=9, fontweight='bold')
    ax2.set_ylabel('time (s, log scale)')
    ax2.set_yscale('log')
    ax2.set_title(f'Time at |S|={sigmas[-1]:,}  (|S|={naive_max_sigma} for naive)', fontsize=11)
    ax2.grid(alpha=0.2, axis='y', which='both')

    plt.tight_layout()
    path = f'{output_dir}/sam_sigma_comparison.png'
    plt.savefig(path, dpi=150, bbox_inches='tight')
    print(f'[done] {path}')
    plt.close()


def plot_part3(data, output_dir='.'):
    p3 = data['part3']
    ns = p3['ns']
    actual = p3['actual_jumps']
    o_n  = p3['o_n']
    o_n2 = p3['o_n2']

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5.5))
    fig.suptitle('SAM worst-case: actual jumps << O(n^2)', fontsize=14, fontweight='bold')

    ax1.plot(ns, actual, 'o-', color=COLORS['actual'], lw=2.5, label='actual jumps')
    ax1.plot(ns, o_n,    '--', color=COLORS['on'],     lw=2,   label='O(n)')
    ax1.plot(ns, o_n2,   ':',  color=COLORS['on2'],    lw=2,   label='O(n^2)')
    ax1.set_yscale('log')
    ax1.set_xlabel('string length n')
    ax1.set_ylabel('total jumps (log scale)')
    ax1.set_title('Log scale - all 3 curves visible', fontsize=12)
    ax1.legend(fontsize=10)
    ax1.grid(alpha=0.2)
    for n, a in zip(ns, actual):
        ax1.annotate(str(a), xy=(n, a), xytext=(3, 6),
                     textcoords='offset points', fontsize=8, color=COLORS['actual'])

    ax2.plot(ns, actual, 'o-', color=COLORS['actual'], lw=2.5, label='actual jumps')
    ax2.plot(ns, o_n,    '--', color=COLORS['on'],     lw=2,   label='O(n)')
    ax2.fill_between(ns, actual, o_n, alpha=0.12, color=COLORS['actual'])
    for n, a in zip(ns, actual):
        ax2.annotate(str(a), xy=(n, a), xytext=(3, 6),
                     textcoords='offset points', fontsize=8, color=COLORS['actual'])
    ax2.set_xlabel('string length n')
    ax2.set_ylabel('total jumps')
    ax2.set_title('Linear scale - actual vs O(n)', fontsize=12)
    ax2.legend(fontsize=10)
    ax2.grid(alpha=0.2)

    plt.tight_layout()
    path = f'{output_dir}/sam_linear_proof.png'
    plt.savefig(path, dpi=150, bbox_inches='tight')
    print(f'[done] {path}')
    plt.close()


def plot_part4(data, output_dir='.'):
    cases = data['part4']['cases']
    n = 500

    cmap = {
        'abbb...c (worst)': COLORS['worst'],
        'aaa... (same)':    COLORS['same'],
        'abc... (cyclic)':  COLORS['cyclic'],
        'random':           COLORS['random'],
    }

    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('SAM: link jumps per insertion (scatter + zoom)', fontsize=15, fontweight='bold')

    for ax, (name, cdata) in zip(axes.flat, cases.items()):
        jumps = cdata['jumps']
        total = cdata['total']
        peak  = cdata['peak']
        amortized = cdata['amortized']
        color = cmap.get(name, '#333')

        x = list(range(1, n + 1))
        ax.scatter(x, jumps, s=8, color=color, alpha=0.5, label='per insertion')
        if peak > 10:
            peak_i = jumps.index(peak) + 1
            ax.annotate(f'peak={peak}', xy=(peak_i, peak),
                        xytext=(peak_i - n * 0.15, peak * 0.6),
                        arrowprops=dict(arrowstyle='->', color='darkred', lw=1.5),
                        fontsize=11, color='darkred', fontweight='bold')

        ax.set_xlabel('insertion step')
        ax.set_ylabel('link jumps')
        ax.set_title(f'{name}  total={total}  avg={amortized:.2f}  peak={peak}',
                     fontsize=11, fontweight='bold')
        ax.set_ylim(-1, max(peak * 1.2, 5))
        ax.grid(alpha=0.15)

        ax_zoom = inset_axes(ax, width='30%', height='35%', loc='upper right', borderpad=1.5)
        ax_zoom.scatter(x[:50], jumps[:50], s=15, color=color, alpha=0.7)
        for i in range(min(50, n)):
            ax_zoom.plot([x[i], x[i]], [0, jumps[i]], color=color, lw=0.5, alpha=0.3)
        ax_zoom.set_title('first 50 steps (zoom)', fontsize=8)
        ax_zoom.set_xlabel('step', fontsize=7)
        ax_zoom.set_ylabel('jumps', fontsize=7)
        ax_zoom.tick_params(labelsize=6)

    plt.tight_layout()
    path = f'{output_dir}/sam_scatter_zoom.png'
    plt.savefig(path, dpi=150, bbox_inches='tight')
    print(f'[done] {path}')
    plt.close()


def main():
    output_dir = sys.argv[1] if len(sys.argv) > 1 else '.'

    print('[info] calling C++ DLL sam_compute()...')
    data = compute_data()
    print(f'[info] data loaded (keys: {list(data.keys())})')

    plot_part1(data, output_dir)
    plot_part2(data, output_dir)
    plot_part3(data, output_dir)
    plot_part4(data, output_dir)
    print('[done] all plots generated')


if __name__ == '__main__':
    main()
