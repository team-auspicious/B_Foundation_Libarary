import fs from "fs";
import fetch from "node-fetch";

const jsonPath = {
    spacing: "./src/spacing/data/foundationSpacing.json",
    color: "./src/color-semantic/data/foundationColorSemantic.json",
    typography: "./src/typography/data/foundationTypography.json",
};

(async () => {
    function getClient(url) {
        if (url.startsWith("https")) {
            return https;
        }

        return http;
    }

    async function get(url, client) {
        const options = {
            method: "get",
            headers: {
                "Content-Type": "application/json",
            },
        };

        return new Promise((resolve, reject) => {
            const callback = (res) => {
                if (res.statusCode < 200 || res.statusCode > 299) {
                    return reject(new Error(`HTTP status code ${res.statusCode}`));
                }

                const body = [];
                res.on("data", (chunk) => body.push(chunk));
                res.on("end", () => {
                    const resString = Buffer.concat(body).toString();
                    resolve(JSON.parse(resString));
                });
            };

            console.log("requesting: " + url);

            const req = client.request(url, options.callback, callback);

            req.on("error", (err) => {
                reject(err);
            });

            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Request time out"));
            });

            req.end();
        });
    }

    function getBaseURL() {
        console.log("env.production", process.env.production);

        if (process.env.production) {
            return "https://lobster-app-ttl6o.ondigitalocean.app";
        }

        return `http://localhost:8080`;
    }

    function generateJSON(res) {
        Object.entries(jsonPath).forEach(([key, value]) => {
            const data = res[key];
            if (fs.existsSync(value)) {
                fs.writeFileSync(value, JSON.stringify(data, null, 2));
            }
        });
    }

    const args = process.argv.slice(2);

    if (args.length !== 1) {
        throw new Error("Invalid number of arguments");
    }

    fs.writeFileSync("./config-generator.json", JSON.stringify({ date: new Date() }, null, 2));

    const verionAPI = getBaseURL() + `/api/foundation-version/${args[0]}`;
    const foundationVersion = await (await fetch(verionAPI)).json();

    const detailAPI = getBaseURL() + `/api/foundation-detail/${foundationVersion.id}`;
    const res = await (await fetch(detailAPI)).json();

    if (!res) {
        throw new Error("Invalid return");
    }

    console.log("generating from", res);

    generateJSON(res);
})();
