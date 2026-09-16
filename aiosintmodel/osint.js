async function fetchText(url) {
    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!response.ok) return "";
        return await response.text();
    } catch {
        return "";
    }
}

async function checkUrl(url) {
    try {
        const response = await fetch(url);
        return response.status === 200;
    } catch {
        return false;
    }
}

function extractPatterns(text) {
    const emails = [...text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)].map(m => m[0]);
    const ips = [...text.matchAll(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g)].map(m => m[0]);
    const domains = [...text.matchAll(/\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g)].map(m => m[0]);
    const images = [...text.matchAll(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|gif|webp)/g)].map(m => m[0]);
    const phones = [...text.matchAll(/\+?[0-9]{1,3}[\s-]?[0-9]{2,4}[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4}/g)].map(m => m[0]);

    return {
        emails: [...new Set(emails)],
        ip_addresses: [...new Set(ips)],
        domains: [...new Set(domains)],
        image_urls: [...new Set(images)],
        phone_numbers: [...new Set(phones)]
    };
}

async function scanUsername(username) {
    if (!username) return {};

    const platforms = {
        GitHub: `https://github.com/${username}`,
        GitLab: `https://gitlab.com/${username}`,
        Twitter: `https://x.com/${username}`,
        Reddit: `https://www.reddit.com/user/${username}`,
        StackOverflow: `https://stackoverflow.com/users/${username}`,
        Steam: `https://steamcommunity.com/id/${username}`,
        TikTok: `https://www.tiktok.com/@${username}`,
        Instagram: `https://www.instagram.com/${username}`,
        Twitch: `https://www.twitch.tv/${username}`,
        YouTube: `https://www.youtube.com/@${username}`,
        Spotify: `https://open.spotify.com/user/${username}`,
        Telegram: `https://t.me/${username}`,
        Snapchat: `https://www.snapchat.com/add/${username}`,
        Pinterest: `https://www.pinterest.com/${username}`,
        LinkedIn: `https://www.linkedin.com/in/${username}`,
        Facebook: `https://www.facebook.com/${username}`,
        Medium: `https://medium.com/@${username}`,
        DevTo: `https://dev.to/${username}`,
        CodePen: `https://codepen.io/${username}`,
        Replit: `https://replit.com/@${username}`,
        HackerRank: `https://www.hackerrank.com/${username}`,
        Kaggle: `https://www.kaggle.com/${username}`,
        Behance: `https://www.behance.net/${username}`,
        Dribbble: `https://dribbble.com/${username}`,
        SoundCloud: `https://soundcloud.com/${username}`,
        Bandcamp: `https://bandcamp.com/${username}`,
        Vimeo: `https://vimeo.com/${username}`,
        Tumblr: `https://www.tumblr.com/${username}`,
        Flickr: `https://www.flickr.com/people/${username}`,
        MyAnimeList: `https://myanimelist.net/profile/${username}`,
        Roblox: `https://www.roblox.com/users/${username}/profile`,
        ChessCom: `https://www.chess.com/member/${username}`,
        Lichess: `https://lichess.org/@/${username}`,
        Strava: `https://www.strava.com/athletes/${username}`,
        Goodreads: `https://www.goodreads.com/${username}`,
        Letterboxd: `https://letterboxd.com/${username}`,
        IMDB: `https://www.imdb.com/user/${username}`,
        Patreon: `https://www.patreon.com/${username}`,
        KoFi: `https://ko-fi.com/${username}`,
        BuyMeACoffee: `https://www.buymeacoffee.com/${username}`,
        Wix: `https://${username}.wixsite.com`,
        WordPress: `https://${username}.wordpress.com`,
        Blogger: `https://${username}.blogspot.com`,
        Keybase: `https://keybase.io/${username}`,
        Mastodon: `https://mastodon.social/@${username}`,
        VK: `https://vk.com/${username}`,
        Bilibili: `https://space.bilibili.com/${username}`,
        Threads: `https://www.threads.net/@${username}`,
        Bluesky: `https://bsky.app/profile/${username}.bsky.social`,
        Rumble: `https://rumble.com/user/${username}`,
        Kick: `https://kick.com/${username}`,
        Trovo: `https://trovo.live/${username}`,
        Deezer: `https://www.deezer.com/en/profile/${username}`,
        LastFM: `https://www.last.fm/user/${username}`
    };

    const results = {};
    for (const [name, url] of Object.entries(platforms)) {
        const exists = await checkUrl(url);
        results[name] = { url, exists };
    }
    return results;
}

async function analyzeWebsites(websites, primaryEmail) {
    const siteReports = {};
    const allDomains = new Set();
    const allImages = new Set();
    const allEmails = new Set();
    const allPhones = new Set();

    for (const url of websites) {
        const html = await fetchText(url);
        if (!html) {
            siteReports[url] = { reachable: false, patterns: {} };
            continue;
        }

        const patterns = extractPatterns(html);
        siteReports[url] = { reachable: true, patterns };

        patterns.domains.forEach(d => allDomains.add(d));
        patterns.image_urls.forEach(i => allImages.add(i));
        patterns.emails.forEach(e => allEmails.add(e));
        patterns.phone_numbers.forEach(p => allPhones.add(p));
    }

    if (primaryEmail) {
        allEmails.delete(primaryEmail);
    }

    return {
        siteReports,
        domains: [...allDomains],
        images: [...allImages],
        emails: [...allEmails],
        phones: [...allPhones]
    };
}

async function runOsint() {
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const domain = document.getElementById("domain").value.trim();
    const websitesRaw = document.getElementById("websites").value;

    const websites = websitesRaw
        .split(",")
        .map(w => w.trim())
        .filter(w => w.length > 0);

    const output = document.getElementById("output");
    output.textContent = "Running OSINT…";

    const report = {
        meta: {
            generated_at: new Date().toISOString(),
            username_input: username || null,
            email_input: email || null,
            domain_input: domain || null,
            websites_input: websites
        },
        accounts: {},
        emails: { provided: email || null, discovered: [] },
        domains: {},
        social: {},
        images: {},
        network: {}
    };

    const accountScan = await scanUsername(username);
    report.accounts.username_scan = accountScan;

    const websiteAnalysis = await analyzeWebsites(websites, email);
    report.social.websites_analysis = websiteAnalysis.siteReports;
    report.domains.from_websites = websiteAnalysis.domains;
    report.images.from_websites = websiteAnalysis.images;
    report.emails.discovered = websiteAnalysis.emails;
    report.social.phone_numbers = websiteAnalysis.phones;

    output.textContent = JSON.stringify(report, null, 4);
}
