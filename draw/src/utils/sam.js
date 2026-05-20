export class SAM {
  constructor() {
    this.next = [{}];
    this.link = [-1];
    this.len = [0];
    this.isClone = [false];
    this.last = 0;
    this.chars = [];
  }

  build(s) {
    this.str = s;
    for (const ch of s) {
      this.extend(ch);
    }
    return this;
  }

  extend(c) {
    const cur = this.next.length;
    this.next.push({});
    this.link.push(0);
    this.len.push(this.len[this.last] + 1);
    this.isClone.push(false);
    this.chars.push(c);

    let p = this.last;
    while (p !== -1 && !(c in this.next[p])) {
      this.next[p][c] = cur;
      p = this.link[p];
    }

    if (p === -1) {
      this.link[cur] = 0;
    } else {
      const q = this.next[p][c];
      if (this.len[p] + 1 === this.len[q]) {
        this.link[cur] = q;
      } else {
        const clone = this.next.length;
        this.next.push({ ...this.next[q] });
        this.link.push(this.link[q]);
        this.len.push(this.len[p] + 1);
        this.isClone.push(true);

        while (p !== -1 && this.next[p][c] === q) {
          this.next[p][c] = clone;
          p = this.link[p];
        }
        this.link[q] = this.link[cur] = clone;
      }
    }
    this.last = cur;
  }

  getTerminals() {
    const set = new Set();
    let p = this.last;
    while (p !== -1) {
      set.add(p);
      p = this.link[p];
    }
    return set;
  }

  getLongestStrings() {
    const n = this.next.length;
    const longest = new Array(n).fill('');
    const order = Array.from({ length: n }, (_, i) => i)
      .sort((a, b) => this.len[a] - this.len[b]);

    for (const p of order) {
      for (const [ch, q] of Object.entries(this.next[p])) {
        const cand = longest[p] + ch;
        if (this.len[p] + 1 === this.len[q] && cand.length > longest[q].length) {
          longest[q] = cand;
        }
      }
    }
    return longest;
  }

  getEndpos() {
    const n = this.next.length;
    const endpos = Array.from({ length: n }, () => []);
    const s = this.str || '';
    let p = 0;
    for (let i = 0; i < s.length; i++) {
      p = this.next[p][s[i]];
      endpos[p].push(i);
    }

    const order = Array.from({ length: n }, (_, i) => i)
      .sort((a, b) => this.len[b] - this.len[a]);

    for (const v of order) {
      const u = this.link[v];
      if (u >= 0 && endpos[v].length) {
        for (const ep of endpos[v]) {
          if (!endpos[u].includes(ep)) endpos[u].push(ep);
        }
        endpos[u].sort((a, b) => a - b);
      }
    }
    return endpos;
  }

  toGraphData(format = 'len') {
    const terminals = this.getTerminals();
    const longestStrings = format === 'string' ? this.getLongestStrings() : null;
    const nodes = [];
    const transEdges = [];
    const linkEdges = [];

    for (let i = 0; i < this.next.length; i++) {
      let group = '默认';
      if (i === 0) group = '初始';
      else if (terminals.has(i)) group = '终止';
      else if (this.isClone[i]) group = '克隆';

      const suffix = format === 'string' && longestStrings && longestStrings[i]
        ? `"${longestStrings[i]}"`
        : `len=${this.len[i]}`;

      nodes.push({
        id: String(i),
        label: `${i} (${suffix})`,
        group,
      });

      for (const [ch, target] of Object.entries(this.next[i])) {
        transEdges.push({
          source: String(i),
          target: String(target),
          weight: (ch.toLowerCase().charCodeAt(0) || 97) - 96,
          label: ch,
          edgeType: 'transition',
        });
      }

      if (this.link[i] >= 0) {
        linkEdges.push({
          source: String(i),
          target: String(this.link[i]),
          weight: 0,
          label: 'link',
          edgeType: 'suffix_link',
        });
      }
    }

    return { nodes, transEdges, linkEdges };
  }
}
