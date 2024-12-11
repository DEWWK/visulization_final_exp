const express = require('express');
const { execFile } = require('child_process');
const { spawn } = require('child_process')
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

app.use(express.static('src'));

app.post('/run-scripts', (req, res) => {
    // 获取当前时间并写入 time.txt
    const currentTime = new Date().toISOString();
    const localTime = new Date(currentTime).toLocaleString();
    const timeFilePath = path.join(__dirname, '../public/data/upd_time.txt');
    fs.writeFileSync(timeFilePath, `上一次更新时间: ${localTime}\n`); // 覆盖写入
    // 执行tem.js
    execFile('node', ['./tem.js'], (err, stdout, stderr) => {
        if (err) {
            console.error(`Error executing tem.js: ${stderr}`);
            return res.json({ success: false, error: stderr });
        }
        console.log(`tem.js output: ${stdout}`);

        // 执行tem2.js
        execFile('node', ['./tem2.js'], (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing tem2.js: ${stderr}`);
                return res.json({ success: false, error: stderr });
            }
            console.log(`tem2.js output: ${stdout}`);

            const python = spawn('python', [path.join(__dirname, './kriging.py')]);

            python.stdout.on('data', (data) => {
                console.log(`kriging.py output: ${data}`);
            });

            python.stderr.on('data', (data) => {
                console.error(`kriging.py error: ${data}`);
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    return res.json({ success: false, error: 'kriging.py execution failed' });
                }

                // 返回成功结果
                res.json({ success: true });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
