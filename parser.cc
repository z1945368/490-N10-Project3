#include <bits/stdc++.h>
using namespace std;

// trim functions
static inline string &ltrim(string &s) {
    s.erase(s.begin(), find_if(s.begin(), s.end(), [](unsigned char ch){ return !isspace(ch); }));
    return s;
}
static inline string &rtrim(string &s) {
    s.erase(find_if(s.rbegin(), s.rend(), [](unsigned char ch){ return !isspace(ch); }).base(), s.end());
    return s;
}
static inline string trim(string s) { return rtrim(ltrim(s)); }

// JSON escape
string json_escape(const string &s) {
    string out;
    out.reserve(s.size()+10);
    for (unsigned char c : s) {
        switch (c) {
            case '\"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b"; break;
            case '\f': out += "\\f"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (c < 0x20) { // control chars
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", c);
                    out += buf;
                } else {
                    out += c;
                }
        }
    }
    return out;
}

// split by semicolon into trimmed tokens (ignores empty tokens)
vector<string> split_semicolon_list(const string &s) {
    vector<string> parts;
    string cur;
    for (size_t i = 0; i < s.size(); ++i) {
        if (s[i] == ';') {
            string t = trim(cur);
            if (!t.empty()) parts.push_back(t);
            cur.clear();
        } else {
            cur.push_back(s[i]);
        }
    }
    string t = trim(cur);
    if (!t.empty()) parts.push_back(t);
    return parts;
}

struct Report {
    string REPORT;
    string ID;
    string REPORTDATE;
    string REFERENCEID;
    string REPORTSOURCE;
    string REPORTDESCRIPTION;
    vector<string> PERSONS;
    vector<string> DATES;
    vector<string> PLACES;
    vector<string> ORGANIZATIONS;

    // produce JSON object string
    string to_json() const {
        string s = "{";
        auto add_field = [&](const string &k, const string &v, bool comma=true) {
            s += "\"" + k + "\":\"" + json_escape(v) + "\"";
            if (comma) s += ",";
        };
        auto add_array = [&](const string &k, const vector<string> &arr, bool comma=true) {
            s += "\"" + k + "\":[";
            for (size_t i = 0; i < arr.size(); ++i) {
                s += "\"" + json_escape(arr[i]) + "\"";
                if (i+1 < arr.size()) s += ",";
            }
            s += "]";
            if (comma) s += ",";
        };

        add_field("REPORT", REPORT);
        add_field("ID", ID);
        add_field("REPORTDATE", REPORTDATE);
        add_field("REFERENCEID", REFERENCEID);
        add_field("REPORTSOURCE", REPORTSOURCE);
        add_field("REPORTDESCRIPTION", REPORTDESCRIPTION);

        add_array("PERSONS", PERSONS);
        add_array("DATES", DATES);
        add_array("PLACES", PLACES);
        add_array("ORGANIZATIONS", ORGANIZATIONS, false); // last one: no trailing comma

        s += "}";
        return s;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    vector<Report> reports;
    string line;
    // read all lines
    vector<string> lines;
    while (std::getline(cin, line)) {
        // Normalize Windows CR
        if (!line.empty() && line.back() == '\r') line.pop_back();
        lines.push_back(line);
    }

    Report cur;
    bool in_report = false;
    bool in_description = false;
    string desc_accum;

    auto start_new_report = [&]() {
        if (in_report) {
            // finalize previous report
            if (in_description) {
                cur.REPORTDESCRIPTION = trim(desc_accum);
                desc_accum.clear();
                in_description = false;
            }
            reports.push_back(cur);
            cur = Report(); // reset
        }
        in_report = true;
    };

    // set of field labels that can start (upper case)
    const vector<string> labels = {
        "ID:", "REPORTDATE:", "REFERENCEID:", "REPORTSOURCE:",
        "REPORTDESCRIPTION:", "PERSONS:", "DATES:", "PLACES:", "ORGANIZATIONS:"
    };

    auto starts_with_label = [&](const string &ln, string &found_label) -> bool {
        for (const string &lab : labels) {
            if (ln.size() >= lab.size() && std::equal(lab.begin(), lab.end(), ln.begin(),
                [](char a, char b){ return toupper((unsigned char)a) == toupper((unsigned char)b); })) {
                found_label = lab;
                return true;
            }
        }
        found_label.clear();
        return false;
    };

    for (size_t i = 0; i < lines.size(); ++i) {
        string ln = trim(lines[i]);
        if (ln.empty()) {
            // blank line: if in description, preserve a newline (optional)
            if (in_description) desc_accum += "\n";
            continue;
        }
        // detect REPORT start (line equals "REPORT" ignoring case)
        string up = ln;
        transform(up.begin(), up.end(), up.begin(), [](unsigned char c){ return toupper(c); });
        if (up == "REPORT") {
            start_new_report();
            continue;
        }

        if (!in_report) {
            // skip stray lines before first REPORT
            continue;
        }

        // If currently accumulating description, check if this line begins a new label
        string found_label;
        if (in_description) {
            if (starts_with_label(ln, found_label) || (trim(ln) == "REPORT")) {
                // close description and process label in next iteration: backtrack i--
                cur.REPORTDESCRIPTION = trim(desc_accum);
                desc_accum.clear();
                in_description = false;
                // reprocess this line (decrement i so the for-loop increments it back)
                --i;
                continue;
            } else {
                // keep appending to description with newline
                if (!desc_accum.empty()) desc_accum += "\n";
                desc_accum += ln;
                continue;
            }
        }

        // not in description: expect lines like KEY: value
        // find first colon
        size_t colon = lines[i].find(':');
        if (colon == string::npos) {
            // weird stray line — attach to description if description label previously seen
            // otherwise skip
            continue;
        }
        string key = trim(lines[i].substr(0, colon+1)); // include colon
        string value = trim(lines[i].substr(colon+1));

        // normalize key uppercase for matching
        string key_up = key;
        transform(key_up.begin(), key_up.end(), key_up.begin(), [](unsigned char c){ return toupper(c); });

        if (key_up == "ID:") {
            cur.ID = value;
        } else if (key_up == "REPORTDATE:") {
            cur.REPORTDATE = value;
        } else if (key_up == "REFERENCEID:") {
            cur.REFERENCEID = value;
        } else if (key_up == "REPORTSOURCE:") {
            cur.REPORTSOURCE = value;
        } else if (key_up == "REPORTDESCRIPTION:") {
            // begin multiline description: the rest of this line is first piece
            in_description = true;
            desc_accum = value;
            // If value is empty, description may follow on subsequent lines
        } else if (key_up == "PERSONS:") {
            cur.PERSONS = split_semicolon_list(value);
        } else if (key_up == "DATES:") {
            cur.DATES = split_semicolon_list(value);
        } else if (key_up == "PLACES:") {
            cur.PLACES = split_semicolon_list(value);
        } else if (key_up == "ORGANIZATIONS:") {
            cur.ORGANIZATIONS = split_semicolon_list(value);
        } else {
            // Unknown key: store it as part of description if reasonable
            // Append as "UnknownKey: value" to description accumulator
            if (!in_description) {
                in_description = true;
                desc_accum = key + " " + value;
            } else {
                if (!desc_accum.empty()) desc_accum += "\n";
                desc_accum += key + " " + value;
            }
        }
    }

    // finalize last report if any
    if (in_report) {
        if (in_description) cur.REPORTDESCRIPTION = trim(desc_accum);
        reports.push_back(cur);
    }

    // produce JSON array
    cout << "[\n";
    for (size_t i = 0; i < reports.size(); ++i) {
        cout << "  " << reports[i].to_json();
        if (i + 1 < reports.size()) cout << ",\n";
        else cout << "\n";
    }
    cout << "]\n";

    return 0;
}
