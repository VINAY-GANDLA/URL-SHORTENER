const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const crypto = require("crypto");
const {PORT} = require("./env.js");

const DATA_FILE = path.join("data", "links.json");

const saveData = async (res,filename,content) => {
    const data = await fs.readFile(path.join('public', filename));
    res.writeHead(200, { 'Content-Type': content});
    res.end(data);
};
const loadlinks = async () => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        if (!data.trim()) {
            return {};//data ledhu kani file exist ayinappudu empty return chey 
        }
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code == 'ENOENT') {//file a ledhu appudu edhi error handle chesthundhi
            await fs.writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        else throw error;
    }
    
}
const savelinks = async(links) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(links));
}
const server = http.createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === '/') {
            try {
                return await saveData(res,"index.html", "text/html");
            }
            catch (error) {
                res.writeHead(404, { 'Content-Type': "text/plain" })
                console.error(error.message);
                return res.end("404 PAGE NOT FOUND");
            }
        }
        else if (req.url === '/style.css') {
            try {
                return await saveData(res,"style.css", "text/css");
            }
            catch (error) {
                res.writeHead(404, { 'Content-Type': "text/plain" });
                console.log(error.message);
                return res.end("Css file not Found");
            }
        }
        else if (req.url==="/links") {
            const links = await loadlinks();
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(links));
        }
        else {
            const links = await loadlinks();
            const shorturl = decodeURIComponent(req.url).slice(1).split(" ")[0];
            console.log(shorturl, req.url);
            if (links[shorturl]) {
                res.writeHead(302, {
                    location: links[shorturl]
                });
                return res.end();
            }
        }
    }
    else if (req.method === "POST" && req.url == '/shorten') {
        const links = await loadlinks();
        let body= "";
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end',async () => {
            const { urllink, shorturl } = JSON.parse(body);
            console.log(urllink, shorturl);
            // const params = new URLSearchParams(body);
            // const url = params.get("url");
            // const shorturl = params.get("shorturl");
            // console.log(url, shorturl);
            
            if (!urllink) {
                res.writeHead(400, {
                    "Content-Type": "text/plain"
                });
                return res.end("URL IS REQUIRED");
            }
            const finalshorturl = shorturl || crypto.randomBytes(4).toString("hex"); 
            if (links[finalshorturl]) {
                res.writeHead(400, {
                    "Content-Type": "text/plain"
                });
                return res.end("shorturl already exist,try another");
            }
            links[finalshorturl] = urllink;
            await savelinks(links);
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: true, shorturl: finalshorturl }));
        });
    }
});
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})