#!/usr/bin/env python3
"""
SAM 一键可视化启动脚本
用法:
  python sam_draw.py "ababc"

流程:
  1. 构建 SAM
  2. 写入 draw/public/sam_data.json
  3. 启动 draw 的 Vite dev server
  4. 打开浏览器 http://localhost:3000
  5. Web 端检测 URL 参数自动加载 SAM
"""

import sys
import json
import os
import time
import shutil
import subprocess
import webbrowser
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DRAW_DIR = SCRIPT_DIR.parent.parent / 'draw'
DATA_FILE = DRAW_DIR / 'public' / 'sam_data.json'
PORT = 3000

sys.path.insert(0, str(SCRIPT_DIR))
from sam_to_json import SAM


def find_npx():
    npx = shutil.which('npx')
    if npx:
        return npx
    npx = shutil.which('npx.cmd')
    if npx:
        return npx
    raise FileNotFoundError('未找到 npx，请确认 Node.js 已安装且在 PATH 中')


def ensure_data(s):
    sam = SAM()
    for ch in s:
        sam.extend(ch)
    data = sam.to_graph_data()
    data['input'] = s
    (DRAW_DIR / 'public').mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    print(f'[1/3] SAM 构建完成: {len(data["nodes"])} 个状态, '
          f'{len(data["transEdges"])} 条转移边, '
          f'{len(data["linkEdges"])} 条后缀链接')
    return data


def start_server():
    npx = find_npx()
    print(f'[2/3] 启动开发服务器 (draw/)...')
    proc = subprocess.Popen(
        [npx, 'vite', '--host', '0.0.0.0', '--port', str(PORT)],
        cwd=str(DRAW_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(3)
    if proc.poll() is not None:
        print('[错误] vite 启动失败，请手动运行: cd draw && npm run dev')
        sys.exit(1)
    return proc


def open_browser():
    url = f'http://localhost:{PORT}'
    url += '?sam'
    print(f'[3/3] 打开浏览器: {url}')
    webbrowser.open(url)
    print(f'\n[完成] SAM 可视化已就绪')
    print(f'  浏览器: {url}')
    print(f'  关闭此窗口后服务器仍在运行，按 Ctrl+C 停止')


def main():
    if len(sys.argv) < 2:
        print('用法: python sam_draw.py <string>', file=sys.stderr)
        print('示例: python sam_draw.py "ababc"', file=sys.stderr)
        sys.exit(1)

    s = sys.argv[1]
    ensure_data(s)
    proc = start_server()
    try:
        open_browser()
    except KeyboardInterrupt:
        pass
    finally:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            pass


if __name__ == '__main__':
    main()
