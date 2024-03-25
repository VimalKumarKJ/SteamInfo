import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 5000;

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.get("/", async(req, res) => {
    try {
        const response = await axios.get("http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json");
        const steamApps = response.data.applist.apps;
        const filteredApps = steamApps.filter(app => app.name && app.name.trim() !== "");
        const appNames = filteredApps.map(app => app.name);
        res.render("cards.ejs", {Apps : appNames});
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/search", async(req, res) => {
    try {
        const searchTerm = req.body.searchTerm;
        const response = await axios.get(`http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json`);
        const steamApps = response.data.applist.apps;
        const filteredApps = steamApps.filter(app => app.name && app.name.trim() !== "");
        const appNames = filteredApps.map(app => app.name);
        

        const foundApp = appNames.find(name => name.toLowerCase() === searchTerm.toLowerCase());

        if(foundApp) {
            const appId = filteredApps.find(app => app.name.toLowerCase() === foundApp.toLowerCase()).appid;
            const appDetailsResponse = await axios.get(`http://store.steampowered.com/api/appdetails?appids=${appId}`);
            const appDetails = appDetailsResponse.data[appId].data;
            const { name, short_description, header_image } = appDetails;
            let priceOverview = null;

            if (appDetails.is_free === true) {
                priceOverview = "Free to play"
            }

            if (appDetails.price_overview) {
                priceOverview = appDetails.price_overview.final_formatted;
            } else {
                priceOverview = "Not available U_U"
            }

            const newsResponse = await axios.get(`http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=${appId}&count=6&format=json`);
            const newsItems = newsResponse.data.appnews.newsitems.map(news => ({
                title: news.title,
                author: news.author,
                contents: news.contents,
                date: new Date(news.date * 1000)
            }));

            res.render('cards.ejs', {
                Name: name,
                Description: short_description,
                final_formatted_price: priceOverview,
                cover_image: header_image,
                app_id: appId,
                Apps: appNames,
                news: newsItems
            });
        } else {
            res.status(404).json({ error: 'App not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

