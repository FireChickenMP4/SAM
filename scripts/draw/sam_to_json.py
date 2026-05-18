#!/usr/bin/env python3
"""
SAM -> JSON 导出工具
用法:
  python sam_to_json.py "ababc"            # 输出 JSON 到 stdout
  python sam_to_json.py "ababc" -o out.json   # 输出到文件
"""

import sys
import json


class SAM:
    def __init__(self):
        self.next = [{}]
        self.link = [-1]
        self.len = [0]
        self.is_clone = [False]
        self.last = 0

    def extend(self, c):
        cur = len(self.next)
        self.next.append({})
        self.link.append(0)
        self.len.append(self.len[self.last] + 1)
        self.is_clone.append(False)

        p = self.last
        while p != -1 and c not in self.next[p]:
            self.next[p][c] = cur
            p = self.link[p]

        if p == -1:
            self.link[cur] = 0
        else:
            q = self.next[p][c]
            if self.len[p] + 1 == self.len[q]:
                self.link[cur] = q
            else:
                clone = len(self.next)
                self.next.append(dict(self.next[q]))
                self.link.append(self.link[q])
                self.len.append(self.len[p] + 1)
                self.is_clone.append(True)

                while p != -1 and self.next[p][c] == q:
                    self.next[p][c] = clone
                    p = self.link[p]
                self.link[q] = self.link[cur] = clone
        self.last = cur

    def get_terminals(self):
        terminals = set()
        p = self.last
        while p != -1:
            terminals.add(p)
            p = self.link[p]
        return terminals

    def get_longest_strings(self):
        n = len(self.next)
        longest = [''] * n
        order = sorted(range(n), key=lambda i: self.len[i])
        for p in order:
            for ch, q in self.next[p].items():
                cand = longest[p] + ch
                if self.len[p] + 1 == self.len[q] and len(cand) > len(longest[q]):
                    longest[q] = cand
        return longest

    def to_graph_data(self, fmt='len'):
        terminals = self.get_terminals()
        longest_strings = self.get_longest_strings() if fmt == 'string' else None
        nodes = []
        trans_edges = []
        link_edges = []

        for i in range(len(self.next)):
            if i == 0:
                group = '初始'
            elif i in terminals:
                group = '终止'
            elif self.is_clone[i]:
                group = '克隆'
            else:
                group = '默认'

            if fmt == 'string' and longest_strings and longest_strings[i]:
                suffix = f'"{longest_strings[i]}"'
            else:
                suffix = f'len={self.len[i]}'

            nodes.append({
                'id': str(i),
                'label': f'{i} ({suffix})',
                'group': group,
            })

            for ch, target in self.next[i].items():
                trans_edges.append({
                    'source': str(i),
                    'target': str(target),
                    'weight': max(1, ord(ch.lower()) - 96),
                    'label': ch,
                    'edgeType': 'transition',
                })

            if self.link[i] >= 0:
                link_edges.append({
                    'source': str(i),
                    'target': str(self.link[i]),
                    'weight': 0,
                    'label': 'link',
                    'edgeType': 'suffix_link',
                })

        return {
            'nodes': nodes,
            'transEdges': trans_edges,
            'linkEdges': link_edges,
        }


def main():
    if len(sys.argv) < 2:
        print('用法: python sam_to_json.py <string> [-o output.json]', file=sys.stderr)
        sys.exit(1)

    s = sys.argv[1]
    output_file = None
    if len(sys.argv) >= 4 and sys.argv[2] == '-o':
        output_file = sys.argv[3]

    sam = SAM()
    for ch in s:
        sam.extend(ch)

    data = sam.to_graph_data()
    data['input'] = s
    json_str = json.dumps(data, ensure_ascii=False, indent=2)

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(json_str)
        print(f'[done] wrote {output_file}', file=sys.stderr)
    else:
        print(json_str)


if __name__ == '__main__':
    main()
