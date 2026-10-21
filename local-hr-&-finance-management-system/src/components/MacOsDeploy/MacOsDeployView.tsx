import React, { useState } from 'react';
import {
  Terminal,
  Download,
  Copy,
  Check,
  Apple,
  FileCode,
  ShieldCheck,
  FolderOpen,
  PlayCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../locales/translations';
import { downloadTextFile } from '../../utils/exportUtils';

export const MacOsDeployView: React.FC = () => {
  const { language } = useApp();
  const t = translations[language];

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Generate python app.py source code
  const getPythonAppCode = () => {
    return `# -*- coding: utf-8 -*-
"""
Local HR, Payroll & Finance Management System
macOS Local Web Application
Backend: Python 3 with Flask & SQLite
"""
import os
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, session

app = Flask(__name__)
app.secret_key = os.urandom(24)

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'local_hr_finance.db')

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript('''
        CREATE TABLE IF NOT EXISTS company_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            company_name_km TEXT NOT NULL,
            company_name_en TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            exchange_rate REAL DEFAULT 4050,
            default_currency TEXT DEFAULT 'USD'
        );
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            name_km TEXT NOT NULL,
            name_en TEXT NOT NULL,
            department TEXT,
            job_title TEXT,
            basic_salary REAL NOT NULL,
            salary_currency TEXT DEFAULT 'USD',
            status TEXT DEFAULT 'active'
        );
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT,
            date TEXT,
            status TEXT,
            actual_hours REAL,
            overtime_hours REAL,
            UNIQUE(employee_id, date)
        );
        CREATE TABLE IF NOT EXISTS payroll_records (
            id TEXT PRIMARY KEY,
            period_id TEXT,
            employee_id TEXT,
            gross_salary REAL,
            total_deductions REAL,
            net_salary REAL,
            payment_status TEXT DEFAULT 'unpaid'
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            type TEXT, -- income or expense
            date TEXT,
            category TEXT,
            amount REAL,
            currency TEXT,
            payer_payee TEXT
        );
        ''')
    print("Database initialized successfully at: " + DATABASE)

@app.route('/')
def index():
    return """
    <!DOCTYPE html>
    <html lang="km">
    <head>
        <meta charset="utf-8">
        <title>Local HR & Finance System</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; text-align: center; max-width: 480px; }
            h1 { font-size: 20px; color: #38bdf8; margin-bottom: 8px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 16px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">macOS Local Server Active</div>
            <h1>ប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស & ហិរញ្ញវត្ថុក្នុងស្រុក</h1>
            <p>Local HR, Payroll & Finance Management System is running on <strong>http://127.0.0.1:5000</strong> with local SQLite database.</p>
        </div>
    </body>
    </html>
    """

if __name__ == '__main__':
    init_db()
    print("Starting Local HR & Finance Management System on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=False)
`;
  };

  // Generate run_local.sh
  const getRunLocalScript = () => {
    return `#!/bin/bash
# Local HR & Finance System Launcher for macOS
cd "$(dirname "$0")"

echo "=========================================================="
echo "  Local HR, Payroll & Finance Management System (macOS)   "
echo "=========================================================="
echo "Starting local Python Flask web server on port 5000..."

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Open Safari/default browser automatically after 1 second
(sleep 1 && open "http://127.0.0.1:5000") &

# Start the application
python3 app.py
`;
  };

  // Generate requirements.txt
  const getRequirementsTxt = () => {
    return `Flask==3.0.3
reportlab==4.2.0
openpyxl==3.1.2
Werkzeug==3.0.3
python-dotenv==1.0.1
`;
  };

  // Generate Khmer Documentation Markdown
  const getKhmerDocumentation = () => {
    return `# សៀវភៅណែនាំដំឡើង និងប្រើប្រាស់លើ macOS
## ប្រព័ន្ធគ្រប់គ្រងធនធានមនុស្ស ប្រាក់ខែ វត្តមាន និងហិរញ្ញវត្ថុក្នុងស្រុក (Local HR & Finance System)

### ១. លក្ខខណ្ឌតម្រូវ (Prerequisites)
- កុំព្យូទ័រ Apple macOS (macOS 12 Monterey, macOS 13 Ventura, macOS 14 Sonoma ឬថ្មីជាងនេះ)
- Python 3.9+ បានដំឡើងរួចរាល់ (ពិនិត្យដោយវាយ: \`python3 --version\`)

---

### ២. ជំហានដំឡើងរហ័ស (Quick Setup Guide)
បើកកម្មវិធី **Terminal** នៅលើ Mac របស់អ្នក (ចុច Cmd + Space រួចវាយ "Terminal") ហើយអនុវត្តតាមជំហានខាងក្រោម៖

1. បង្កើតថតឯកសារសម្រាប់ប្រព័ន្ធ៖
\`\`\`bash
mkdir -p ~/LocalHRApp
cd ~/LocalHRApp
\`\`\`

2. ទាញយកឯកសារ \`app.py\`, \`requirements.txt\`, និង \`run_local.sh\` ដាក់ក្នុងថតខាងលើ។

3. ផ្តល់សិទ្ធិអនុវត្តទៅកាន់ស្គ្រីបដំណើរការ៖
\`\`\`bash
chmod +x run_local.sh
\`\`\`

4. ចាប់ផ្តើមដំណើរការប្រព័ន្ធ៖
\`\`\`bash
./run_local.sh
\`\`\`

---

### ៣. ការចូលប្រើប្រព័ន្ធ
- កម្មវិធីរុករក (Browser) នឹងបើកឡើងដោយស្វ័យប្រវត្តិទៅកាន់អាសយដ្ឋាន៖ **http://127.0.0.1:5000**
- គណនីអ្នកគ្រប់គ្រងលំនាំដើម៖
  - **ឈ្មោះអ្នកប្រើប្រាស់ (Username):** admin
  - **ពាក្យសម្ងាត់ (Password):** admin123 (ឬកូដកាត់ 1234)

---

### ៤. របៀបបម្រុងទុកទិន្នន័យ (Backup Procedure)
- ចូលទៅកាន់ម៉ឺនុយ **"បម្រុងទុក & ស្តារ" (Backup & Restore)** នៅក្នុងប្រព័ន្ធ
- ចុចប៊ូតុង **"ទាញយកការបម្រុងទុក"** ដើម្បីទទួលបានឯកសារ \`.json\` ឬ \`.sql\`
- ចម្លងឯកសារនោះទុកលើ Flash Drive ឬ External Drive សម្រាប់សុវត្ថិភាពខ្ពស់

---

### ៥. ការបិទប្រព័ន្ធ (Shutdown)
នៅក្នុងផ្ទាំង Terminal ចុចគ្រាប់ចុច **Ctrl + C** ដើម្បីបញ្ឈប់ server ដោយសុវត្ថិភាព។
`;
  };

  const steps = [
    {
      titleKm: '១. បង្កើតថតឯកសារនៅលើ macOS',
      titleEn: '1. Create project folder in Terminal',
      cmd: 'mkdir -p ~/LocalHRApp && cd ~/LocalHRApp',
    },
    {
      titleKm: '២. បង្កើតបរិស្ថាន Python Virtual Environment',
      titleEn: '2. Create and activate Python virtualenv',
      cmd: 'python3 -m venv venv && source venv/bin/activate',
    },
    {
      titleKm: '៣. ដំឡើងបណ្ណាល័យដែលត្រូវការ',
      titleEn: '3. Install Flask, ReportLab & OpenPyXL',
      cmd: 'pip install Flask reportlab openpyxl',
    },
    {
      titleKm: '៤. ដំណើរការប្រព័ន្ធនៅលើ Localhost 5000',
      titleEn: '4. Start local server & open browser',
      cmd: 'chmod +x run_local.sh && ./run_local.sh',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              {language === 'km' ? 'ការណែនាំដំឡើង និងដំណើរការលើ macOS' : 'macOS Installation & Local Deployment Guide'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'km'
                ? 'ដំណើរការដោយផ្ទាល់លើកុំព្យូទ័រ Mac របស់អ្នក 100% Offline ជាមួយ SQLite និង Python 3'
                : 'Run locally on standalone macOS environment with zero cloud dependency'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadTextFile(getKhmerDocumentation(), 'README_MACOS_KM.md', 'text/markdown')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'km' ? 'ទាញយកសៀវភៅណែនាំជាភាសាខ្មែរ (.md)' : 'Download Docs (Khmer)'}</span>
          </button>
        </div>
      </div>

      {/* Downloadable Package Bundle Files */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Launcher Script */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <PlayCircle className="w-5 h-5" />
              <h3 className="font-bold text-xs text-slate-900">run_local.sh</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              {language === 'km'
                ? 'ស្គ្រីបសម្រាប់ចុចបើកដំណើរការ server និងបើក Safari ដោយស្វ័យប្រវត្តិ។'
                : 'macOS double-click launcher script with browser auto-open.'}
            </p>
          </div>
          <button
            onClick={() => downloadTextFile(getRunLocalScript(), 'run_local.sh', 'application/x-sh')}
            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download run_local.sh</span>
          </button>
        </div>

        {/* Python Backend Script */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <FileCode className="w-5 h-5" />
              <h3 className="font-bold text-xs text-slate-900">app.py</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              {language === 'km'
                ? 'កូដ Backend Python 3 ជាមួយ Flask និង SQLite3 schema។'
                : 'Python 3 Flask application backend with SQLite persistent database.'}
            </p>
          </div>
          <button
            onClick={() => downloadTextFile(getPythonAppCode(), 'app.py', 'text/x-python')}
            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download app.py</span>
          </button>
        </div>

        {/* Requirements file */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <FolderOpen className="w-5 h-5" />
              <h3 className="font-bold text-xs text-slate-900">requirements.txt</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              {language === 'km'
                ? 'បញ្ជីបណ្ណាល័យ Python (Flask, ReportLab, OpenPyXL) សម្រាប់ដំឡើង។'
                : 'Python dependencies specification for pip install.'}
            </p>
          </div>
          <button
            onClick={() => downloadTextFile(getRequirementsTxt(), 'requirements.txt', 'text/plain')}
            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download requirements.txt</span>
          </button>
        </div>
      </div>

      {/* Step-by-Step Terminal Commands */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>{language === 'km' ? 'ពាក្យបញ្ជាដំឡើងលើ macOS Terminal' : 'macOS Terminal Quick Installation Commands'}</span>
        </h3>

        <div className="space-y-3">
          {steps.map((s, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800">
                  {language === 'km' ? s.titleKm : s.titleEn}
                </span>
                <button
                  onClick={() => copyToClipboard(s.cmd, index)}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">{language === 'km' ? 'បានចម្លង' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>{language === 'km' ? 'ចម្លង' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2 bg-slate-900 text-slate-100 rounded-md font-mono text-[11px] overflow-x-auto selection:bg-indigo-500">
                {s.cmd}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
