#include <vector>
#include <string>
#include <unordered_map>
#include <map>
#include <algorithm>
#include <chrono>
#include <random>
#include <iomanip>
#include <sstream>
#include <numeric>
#include <cstring>

// ========== lightweight JSON writer ==========

class JsonWriter {
    std::ostringstream os;
    int indent = 0;
    bool needComma = false;
    bool pretty = true;

    void nl() { if (pretty) os << "\n" << std::string(indent * 2, ' '); }

    static std::string escape(const std::string& s) {
        std::string out;
        for (char c : s) {
            switch (c) {
                case '"': out += "\\\""; break;
                case '\\': out += "\\\\"; break;
                case '\n': out += "\\n"; break;
                case '\r': out += "\\r"; break;
                case '\t': out += "\\t"; break;
                default: out += c;
            }
        }
        return out;
    }

public:
    JsonWriter(bool prettyPrint = true) : pretty(prettyPrint) {}

    std::string str() { return os.str(); }

    JsonWriter& objBegin() { os << "{"; indent++; needComma = false; return *this; }
    JsonWriter& objEnd() { indent--; nl(); os << "}"; needComma = true; return *this; }
    JsonWriter& arrBegin() { os << "["; indent++; needComma = false; return *this; }
    JsonWriter& arrEnd() { indent--; nl(); os << "]"; needComma = true; return *this; }

    JsonWriter& key(const std::string& k) {
        if (needComma) os << ",";
        nl(); os << "\"" << escape(k) << "\":"; needComma = false;
        return *this;
    }

    JsonWriter& value(const std::string& v) {
        if (needComma) os << ",";
        nl(); os << "\"" << escape(v) << "\""; needComma = true;
        return *this;
    }

    JsonWriter& value(int v) {
        if (needComma) os << ",";
        nl(); os << v; needComma = true;
        return *this;
    }

    JsonWriter& value(double v) {
        if (needComma) os << ",";
        nl(); os << std::fixed << std::setprecision(10) << v; needComma = true;
        return *this;
    }

    JsonWriter& arrValue(const std::vector<int>& vec) {
        if (needComma) os << ",";
        nl(); arrBegin();
        for (size_t i = 0; i < vec.size(); i++) {
            if (i > 0) os << ",";
            os << vec[i];
        }
        arrEnd(); needComma = true;
        return *this;
    }

    JsonWriter& arrValue(const std::vector<double>& vec) {
        if (needComma) os << ",";
        nl(); arrBegin();
        for (size_t i = 0; i < vec.size(); i++) {
            if (i > 0) os << ",";
            os << std::fixed << std::setprecision(10) << vec[i];
        }
        arrEnd(); needComma = true;
        return *this;
    }
};

// ========== SAM Implementations ==========

class SAM_Array {
public:
    int sigma;
    std::vector<std::vector<int>> next;
    std::vector<int> link, len;
    int last;

    SAM_Array(int sigma = 26) : sigma(sigma), last(0) {
        next.emplace_back(sigma, 0);
        link.push_back(-1);
        len.push_back(0);
    }

    int extend(int c) {
        int cur = (int)next.size();
        next.emplace_back(sigma, 0);
        link.push_back(0);
        len.push_back(len[last] + 1);

        int p = last;
        int jumpCount = 0;
        while (p != -1 && next[p][c] == 0) {
            next[p][c] = cur;
            p = link[p];
            jumpCount++;
        }
        if (p == -1) {
            link[cur] = 0;
        } else {
            int q = next[p][c];
            if (len[p] + 1 == len[q]) {
                link[cur] = q;
            } else {
                int copy = (int)next.size();
                next.push_back(next[q]);
                link.push_back(link[q]);
                len.push_back(len[p] + 1);
                int redirect = 0;
                while (p != -1 && next[p][c] == q) {
                    next[p][c] = copy;
                    p = link[p];
                    redirect++;
                }
                jumpCount += redirect;
                link[q] = link[cur] = copy;
            }
        }
        last = cur;
        return jumpCount;
    }
};

class SAM_HashMap {
public:
    std::vector<std::unordered_map<int, int>> next;
    std::vector<int> link, len;
    int last;

    SAM_HashMap() : last(0) {
        next.emplace_back();
        link.push_back(-1);
        len.push_back(0);
    }

    int extend(int c) {
        int cur = (int)next.size();
        next.emplace_back();
        link.push_back(0);
        len.push_back(len[last] + 1);

        int p = last;
        int jumpCount = 0;
        while (p != -1 && next[p].count(c) == 0) {
            next[p][c] = cur;
            p = link[p];
            jumpCount++;
        }
        if (p == -1) {
            link[cur] = 0;
        } else {
            int q = next[p][c];
            if (len[p] + 1 == len[q]) {
                link[cur] = q;
            } else {
                int copy = (int)next.size();
                next.push_back(next[q]);
                link.push_back(link[q]);
                len.push_back(len[p] + 1);
                int redirect = 0;
                while (p != -1 && next[p][c] == q) {
                    next[p][c] = copy;
                    p = link[p];
                    redirect++;
                }
                jumpCount += redirect;
                link[q] = link[cur] = copy;
            }
        }
        last = cur;
        return jumpCount;
    }
};

class SAM_TreeMap {
public:
    std::vector<std::map<int, int>> next;
    std::vector<int> link, len;
    int last;

    SAM_TreeMap() : last(0) {
        next.emplace_back();
        link.push_back(-1);
        len.push_back(0);
    }

    int extend(int c) {
        int cur = (int)next.size();
        next.emplace_back();
        link.push_back(0);
        len.push_back(len[last] + 1);

        int p = last;
        int jumpCount = 0;
        while (p != -1 && next[p].count(c) == 0) {
            next[p][c] = cur;
            p = link[p];
            jumpCount++;
        }
        if (p == -1) {
            link[cur] = 0;
        } else {
            int q = next[p][c];
            if (len[p] + 1 == len[q]) {
                link[cur] = q;
            } else {
                int copy = (int)next.size();
                next.push_back(next[q]);
                link.push_back(link[q]);
                len.push_back(len[p] + 1);
                int redirect = 0;
                while (p != -1 && next[p][c] == q) {
                    next[p][c] = copy;
                    p = link[p];
                    redirect++;
                }
                jumpCount += redirect;
                link[q] = link[cur] = copy;
            }
        }
        last = cur;
        return jumpCount;
    }
};

class SAM_NaiveArray {
public:
    int sigma;
    std::vector<std::vector<int>> next;
    std::vector<int> link, len;
    int last;

    SAM_NaiveArray(int sigma) : sigma(sigma), last(0) {
        next.emplace_back(sigma, 0);
        link.push_back(-1);
        len.push_back(0);
    }

    int extend(int c) {
        int cur = (int)next.size();
        next.emplace_back(sigma, 0);
        link.push_back(0);
        len.push_back(len[last] + 1);

        int p = last;
        int jumpCount = 0;
        while (p != -1 && next[p][c] == 0) {
            next[p][c] = cur;
            p = link[p];
            jumpCount++;
        }
        if (p == -1) {
            link[cur] = 0;
        } else {
            int q = next[p][c];
            if (len[p] + 1 == len[q]) {
                link[cur] = q;
            } else {
                int copy = (int)next.size();
                next.push_back(next[q]);
                link.push_back(link[q]);
                len.push_back(len[p] + 1);
                int redirect = 0;
                while (p != -1 && next[p][c] == q) {
                    next[p][c] = copy;
                    p = link[p];
                    redirect++;
                }
                jumpCount += redirect;
                link[q] = link[cur] = copy;
            }
        }
        last = cur;
        return jumpCount;
    }
};

// ========== utility ==========

static double mean(const std::vector<double>& v) {
    if (v.empty()) return 0;
    double sum = std::accumulate(v.begin(), v.end(), 0.0);
    return sum / v.size();
}

// ========== Part 1: Jump comparison ==========

static void runPart1(JsonWriter& jw) {
    const int n = 300;
    std::mt19937 rng(42);

    struct Case { std::string name; std::string str; };

    std::vector<Case> cases = {
        {"abbb...c (worst)", "a" + std::string(n - 2, 'b') + "c"},
        {"aaa... (same char)", std::string(n, 'a')},
    };
    std::string cyclic;
    for (int i = 0; i < n; i++) cyclic += (char)('a' + (i % 26));
    cases.push_back({"abc... (cyclic)", cyclic});
    std::uniform_int_distribution<int> dist(0, 7);
    std::string random;
    for (int i = 0; i < n; i++) random += (char)('a' + dist(rng));
    cases.push_back({"random", random});

    jw.key("part1").objBegin();
    jw.key("cases").objBegin();

    for (auto& c : cases) {
        SAM_HashMap sam;
        std::vector<int> jumps;
        int total = 0;
        for (char ch : c.str) {
            int j = sam.extend((int)(unsigned char)ch);
            jumps.push_back(j);
            total += j;
        }
        jw.key(c.name).objBegin();
        jw.key("n").value((int)jumps.size());
        jw.key("total").value(total);
        jw.key("amortized").value((double)total / jumps.size());
        jw.key("jumps").arrValue(jumps);
        jw.objEnd();
    }

    jw.objEnd();
    jw.objEnd();
}

// ========== Part 2: Large sigma comparison (inside SAM) ==========

static void runPart2(JsonWriter& jw) {
    const int n = 50000;
    const int TRIALS = 5;

    // sigma 从 26 拉到 10000000, 看 treemap 的 O(log|S|) 是否显现
    // naive array 受 O(n*|S|) 内存限制, 只测到 5000
    std::vector<int> sigmas = {26, 100, 500, 1000, 2000, 5000, 10000, 20000,
                               50000, 100000, 500000, 1000000, 5000000, 10000000};
    std::vector<int> sigmas_naive = {26, 100, 500, 1000, 2000, 5000};

    auto inNaive = [&](int sigma) -> bool {
        return std::find(sigmas_naive.begin(), sigmas_naive.end(), sigma) != sigmas_naive.end();
    };

    // 为每个 sigma 生成 codepoint 序列 (hashmap/treemap 用)
    struct TestData { std::vector<int> codepoints; };
    std::vector<TestData> allData(sigmas.size());

    for (size_t idx = 0; idx < sigmas.size(); idx++) {
        int sigma = sigmas[idx];
        std::mt19937 rng(42);
        std::uniform_int_distribution<int> dist(0, sigma - 1);
        std::vector<int> cps(n);
        for (int i = 0; i < n; i++) cps[i] = 0x4E00 + dist(rng);
        allData[idx].codepoints = cps;
    }

    // 固定 ascii 串 (array + naive array 用)
    std::mt19937 rngAscii(42);
    std::uniform_int_distribution<int> asciiDist(0, 25);
    std::string asciiStr;
    for (int i = 0; i < n; i++) asciiStr += (char)('a' + asciiDist(rngAscii));

    std::vector<double> times_array, times_hashmap, times_treemap, times_naive;

    // 1) array (fixed sigma=26, baseline)
    for (size_t idx = 0; idx < sigmas.size(); idx++) {
        std::vector<double> ts;
        for (int trial = 0; trial < TRIALS; trial++) {
            SAM_Array sam(26);
            auto t0 = std::chrono::high_resolution_clock::now();
            for (char ch : asciiStr) sam.extend(ch - 'a');
            auto t1 = std::chrono::high_resolution_clock::now();
            ts.push_back(std::chrono::duration<double>(t1 - t0).count());
        }
        times_array.push_back(mean(ts));
    }

    // 2) hash map (SAM inside, large sigma)
    for (size_t idx = 0; idx < sigmas.size(); idx++) {
        std::vector<double> ts;
        for (int trial = 0; trial < TRIALS; trial++) {
            SAM_HashMap sam;
            auto t0 = std::chrono::high_resolution_clock::now();
            for (int cp : allData[idx].codepoints) sam.extend(cp);
            auto t1 = std::chrono::high_resolution_clock::now();
            ts.push_back(std::chrono::duration<double>(t1 - t0).count());
        }
        times_hashmap.push_back(mean(ts));
    }

    // 3) tree map (SAM inside, large sigma)
    for (size_t idx = 0; idx < sigmas.size(); idx++) {
        std::vector<double> ts;
        for (int trial = 0; trial < TRIALS; trial++) {
            SAM_TreeMap sam;
            auto t0 = std::chrono::high_resolution_clock::now();
            for (int cp : allData[idx].codepoints) sam.extend(cp);
            auto t1 = std::chrono::high_resolution_clock::now();
            ts.push_back(std::chrono::duration<double>(t1 - t0).count());
        }
        times_treemap.push_back(mean(ts));
    }

    // 4) naive array (O(n*|S|), 只测到 sigma=5000)
    for (size_t idx = 0; idx < sigmas.size(); idx++) {
        int sigma = sigmas[idx];
        if (!inNaive(sigma)) {
            times_naive.push_back(0);
            continue;
        }
        std::vector<double> ts;
        for (int trial = 0; trial < TRIALS; trial++) {
            SAM_NaiveArray sam(sigma);
            auto t0 = std::chrono::high_resolution_clock::now();
            for (char ch : asciiStr) sam.extend((ch - 'a') % sigma);
            auto t1 = std::chrono::high_resolution_clock::now();
            ts.push_back(std::chrono::duration<double>(t1 - t0).count());
        }
        times_naive.push_back(mean(ts));
    }

    jw.key("part2").objBegin();
    jw.key("sigmas").arrValue(sigmas);
    jw.key("sigmas_naive").arrValue(sigmas_naive);
    jw.key("n").value(n);
    jw.key("times_array").arrValue(times_array);
    jw.key("times_hashmap").arrValue(times_hashmap);
    jw.key("times_treemap").arrValue(times_treemap);
    jw.key("times_naive").arrValue(times_naive);
    jw.objEnd();
}

// ========== Part 3: Linear amortized proof ==========

static void runPart3(JsonWriter& jw) {
    std::vector<int> ns = {100, 200, 500, 1000, 2000, 5000};
    std::vector<int> actual_jumps, o_n, o_n2;

    for (int n : ns) {
        std::string s = "a" + std::string(n - 2, 'b') + "c";
        SAM_HashMap sam;
        int total = 0;
        for (char ch : s) total += sam.extend((int)(unsigned char)ch);
        actual_jumps.push_back(total);
        o_n.push_back(n);
        o_n2.push_back(n * (n + 1) / 2);
    }

    jw.key("part3").objBegin();
    jw.key("ns").arrValue(ns);
    jw.key("actual_jumps").arrValue(actual_jumps);
    jw.key("o_n").arrValue(o_n);
    jw.key("o_n2").arrValue(o_n2);
    jw.objEnd();
}

// ========== Part 4: Scatter + zoom ==========

static void runPart4(JsonWriter& jw) {
    const int n = 500;
    std::mt19937 rng(42);

    struct Case { std::string name; std::string str; };

    std::vector<Case> cases = {
        {"abbb...c (worst)", "a" + std::string(n - 2, 'b') + "c"},
        {"aaa... (same)", std::string(n, 'a')},
    };
    std::string cyclic;
    for (int i = 0; i < n; i++) cyclic += (char)('a' + (i % 26));
    cases.push_back({"abc... (cyclic)", cyclic});
    std::uniform_int_distribution<int> dist(0, 7);
    std::string random;
    for (int i = 0; i < n; i++) random += (char)('a' + dist(rng));
    cases.push_back({"random", random});

    jw.key("part4").objBegin();
    jw.key("cases").objBegin();

    for (auto& c : cases) {
        SAM_HashMap sam;
        std::vector<int> jumps;
        int total = 0, peak = 0;
        for (char ch : c.str) {
            int j = sam.extend((int)(unsigned char)ch);
            jumps.push_back(j);
            total += j;
            if (j > peak) peak = j;
        }
        jw.key(c.name).objBegin();
        jw.key("n").value(n);
        jw.key("total").value(total);
        jw.key("amortized").value((double)total / n);
        jw.key("peak").value(peak);
        jw.key("jumps").arrValue(jumps);
        jw.objEnd();
    }

    jw.objEnd();
    jw.objEnd();
}

// ========== DLL entry point ==========

extern "C" {

__declspec(dllexport) const char* sam_compute() {
    JsonWriter jw(false);
    jw.objBegin();
    runPart1(jw);
    runPart2(jw);
    runPart3(jw);
    runPart4(jw);
    jw.objEnd();

    std::string json = jw.str();
    char* buf = (char*)std::malloc(json.size() + 1);
    if (buf) {
        std::memcpy(buf, json.c_str(), json.size() + 1);
    }
    return buf;
}

__declspec(dllexport) void sam_free_string(const char* str) {
    std::free((void*)str);
}

} // extern "C"
