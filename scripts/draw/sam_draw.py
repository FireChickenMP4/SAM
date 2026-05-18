#!/usr/bin/env python3
"""
SAM 一键可视化启动脚本
用法:
  python sam_draw.py "ababc"

流程:
  1. 构建 SAM
  2. 写入 draw/public/sam_data.json
  3. 检测已运行的 Vite dev server 端口 (3000-3009)
  4. 如未运行则自动启动
  5. 打开浏览器 http://localhost:{port}?sam
"""

import sys
import json
import time
import shutil
import subprocess
import urllib.request
import urllib.error
import webbrowser
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DRAW_DIR = SCRIPT_DIR.parent.parent / 'draw'
DATA_FILE = DRAW_DIR / 'public' / 'sam_data.json'

sys.path.insert(0, str(SCRIPT_DIR))
from sam_to_json import SAM


def find_npx():
    npx = shutil.which('npx') or shutil.which('npx.cmd')
    if not npx:
        raise FileNotFoundError('未找到 npx，请确认 Node.js 已安装且在 PATH 中')
    return npx


def find_vite_port(start=3000, end=3009):
    for port in range(start, end + 1):
        try:
            req = urllib.request.urlopen(
                f'http://localhost:{port}', timeout=0.5)
            req.close()
            return port
        except Exception:
            pass
    return None


def ensure_data(s):
    sam = SAM()
    for ch in s:
        sam.extend(ch)
    data = sam.to_graph_data()
    data['input'] = s
    (DRAW_DIR / 'public').mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    print(f'[1/2] SAM 构建完成: {len(data["nodes"])} 个状态, '
          f'{len(data["transEdges"])} 条转移边, '
          f'{len(data["linkEdges"])} 条后缀链接')
    return data


def ensure_server():
    port = find_vite_port()
    if port:
        print(f'[2/2] 检测到已有 dev server (端口 {port}), 直接使用')
        return port, None

    print(f'[2/2] 未检测到运行中的 server, 启动 Vite...')
    npx = find_npx()
    proc = subprocess.Popen(
        [npx, 'vite', '--host', '0.0.0.0', '--port', '3000'],
        cwd=str(DRAW_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(3)
    if proc.poll() is not None:
        print('[错误] Vite 启动失败，请手动运行: cd draw && npm run dev')
        sys.exit(1)

    port = find_vite_port()
    if not port:
        port = 3000
    return port, proc


def open_browser(port):
    url = f'http://localhost:{port}?sam'
    print(f'      打开浏览器: {url}')
    webbrowser.open(url)
    print(f'\n[完成] SAM 可视化已就绪')
    print(f'  浏览器: {url}')
    print(f'  如果已手动启动 npm run dev，先 Ctrl+C 退出脚本')


def main():
    if len(sys.argv) < 2:
        print('用法: python sam_draw.py <string>', file=sys.stderr)
        print('示例: python sam_draw.py "ababc"', file=sys.stderr)
        sys.exit(1)

    s = sys.argv[1]
    ensure_data(s)
    port, proc = ensure_server()
    try:
        open_browser(port)
    except KeyboardInterrupt:
        pass
    finally:
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except Exception:
                pass


if __name__ == '__main__':
    main()
