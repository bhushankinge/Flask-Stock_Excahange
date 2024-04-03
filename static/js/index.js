let searchIcon;
let searchInput;
let cancelButton;

document.addEventListener('DOMContentLoaded', function () {

    const searchIcon = document.querySelector('.search-icon');
    const cancelButton = document.querySelector('.cancel-button');
    const navBar = document.querySelector('.nav-bar');
    const companyDetails = document.getElementById('company');
    const noRecordDiv = document.querySelector('.no-record');
    noRecordDiv.style.display = 'none';
    const navItems = document.querySelectorAll('.nav-bar div');
    const stockSummaryDetails = document.getElementById('stock-summary');
    const latestNewsDetails = document.getElementById('latest-news');
    const chartsDetails = document.getElementById('charts');


    document.getElementById('stockSearchForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input').value;
        sendSearchQuery(searchInput);
    });


    // Hide no-record div by default



    //took help of chatgpt to get this date fucntion done as I was unaware of how to do it in javascript
    function getTodaysDate() {
        const today = new Date();
        const year = today.getFullYear();

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    //The below function finds the max and min volume value so that we can provide it in the highchart
    function findMaxMinVolume(volumeData) {
        const maxVolume = volumeData.reduce((max, current) => {
            return current[1] > max ? current[1] : max;
        }, volumeData[0][1]);

        const minVolume = volumeData.reduce((min, current) => {
            return current[1] < min ? current[1] : min;
        }, volumeData[0][1]);

        return { maxVolume, minVolume };
    }

    //The below function is used to add and remove darker-color class to nav-bar elements so that we can have
    // a darker background on the tab we are in right now.
    function removeDarkerColorClass() {
        navItems.forEach(item => {
            item.classList.remove('darker-color');
        });
    }


    // The below function keeps track of which nav-bar element is clicked at the moment and what action it should take
    // it's basically manupilating the front end css 
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            removeDarkerColorClass();
            item.classList.add('darker-color');

            hideAllSections();
            let container = document.querySelector('.container');
            // Using classList.contains for better flexibility
            if (item.classList.contains('company')) {
                companyDetails.style.display = '';
                container.style.marginTop = '160px';
            } else if (item.classList.contains('stock-summary')) {
                stockSummaryDetails.style.display = '';
                container.style.marginTop = '160px';
            } else if (item.classList.contains('charts')) {

                container.style.marginTop = '300px';
                chartsDetails.style.display = '';
            } else if (item.classList.contains('latest-news')) {
                container.style.marginTop = '350px';
                latestNewsDetails.style.display = '';
            }
        });
    });


    document.querySelector('.nav-bar .company').classList.add('darker-color');

    // The below given listner check if we clicked the search icon button to search a value
    searchIcon.addEventListener('click', () => {
        if (searchInput === '') {
            // showNoRecord(true);
        } else {
            showNoRecord(false);
            // sendSearchQuery(searchInput.value.trim());
            history.pushState(null, '', '');

        }
    });


    // THis is where we are using XMLHttps request to communicate with the backend
    const sendSearchQuery = (query) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/?query=${encodeURIComponent(query)}`, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);

                    if (response.is_valid) {
                        const { search_query, quote, recommendation, news, price, volume } = response;
                        const { maxVolume, minVolume } = findMaxMinVolume(response.volume);
                        // Assuming response contains data to show in company details
                        updateCompanyDetails(search_query);
                        updateStockSummaryDetails(search_query, quote, recommendation);
                        displayCharts(price, volume, maxVolume, minVolume, search_query);
                        displayNews(news);
                        showSearchResults(); // Show navBar and companyDetails
                    } else {
                        hideSearchResults();
                        showNoRecord(true); // Show no-record message
                    }
                } else {
                    hideSearchResults();
                    showNoRecord(true); // Show no-record message on request error
                }
            }
        };

        xhr.onerror = function () {
            console.error('Request failed');
            hideSearchResults();
            showNoRecord(true); // Show no-record message on request failure
        };

        xhr.send();
    };

    cancelButton.addEventListener('click', () => {
        document.querySelector('.search-input').value = '';
        hideSearchResults();
    });



    function hideAllSections() {
        companyDetails.style.display = 'none';
        stockSummaryDetails.style.display = 'none';
        chartsDetails.style.display = 'none';
        latestNewsDetails.style.display = 'none';
        // Hide other sections as needed
    }

    function hideSearchResults() {
        navBar.style.display = 'none';
        hideAllSections();
        noRecordDiv.style.display = 'none';
        removeDarkerColorClass();
        document.querySelector('.nav-bar .company').classList.add('darker-color');
    }

    function showSearchResults() {
        navBar.style.display = '';
        hideAllSections();
        companyDetails.style.display = '';
        noRecordDiv.style.display = 'none';
        removeDarkerColorClass();
        document.querySelector('.nav-bar .company').classList.add('darker-color');
    }

    //Below function shows the no records html code when we have empty input of wrong input

    function showNoRecord(show) {
        noRecordDiv.style.display = show ? '' : 'none'; // Only show the no-record div
    }


    // THis function updates the company details HTML block with data
    function updateCompanyDetails(search_query) {
        document.querySelector('.company-name-data').textContent = search_query.name || 'N/A';
        document.querySelector('.symbol-data').textContent = search_query.ticker || 'N/A';
        document.querySelector('.exchange-data').textContent = search_query.exchange || 'N/A';
        document.querySelector('.start-data').textContent = search_query.ipo || 'N/A';
        document.querySelector('.category-data').textContent = search_query.finnhubIndustry || 'N/A';

        const logoImgElement = document.querySelector('.logo img');
        if (search_query.logo) {
            logoImgElement.src = search_query.logo;
            logoImgElement.alt = `${search_query.name} Logo`;
        } else {
            logoImgElement.src = '';
            logoImgElement.alt = 'Logo not available';
        }
    }

    function formatUnixTimeStamp(unixTimeStamp) {
        const date = new Date(unixTimeStamp * 1000);

        const day = date.getDate();

        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        const year = date.getFullYear();

        return `${day} ${months[date.getMonth()]}, ${year}`;
    }

    // THis function updates the stock Summary details HTML block with data

    function updateStockSummaryDetails(search_query, quote, recommendation) {
        document.querySelector('.ticker-data').textContent = search_query.name || 'N/A';
        document.querySelector('.trading-data').textContent = formatUnixTimeStamp(quote.t) || 'N/A';
        document.querySelector('.closing-data').textContent = quote.pc || 'N/A';
        document.querySelector('.opening-data').textContent = quote.o || 'N/A';
        document.querySelector('.high-data').textContent = quote.h || 'N/A';
        document.querySelector('.low-data').textContent = quote.l || 'N/A';


        const changeDataElement = document.querySelector('.Change-data');
        let changeHtml = `${quote.d || 'N/A'} `;
        if (quote.d > 0) {
            changeHtml += '<img src="../static/images/GreenArrowUp.png" alt="Increase">';
        } else if (quote.d < 0) {
            changeHtml += '<img src="../static/images/RedArrowDown.png" alt="Decrease">';
        }
        changeDataElement.innerHTML = changeHtml;

        const percentDataElement = document.querySelector('.Percent-data');
        let percentHtml = `${quote.dp || 'N/A'} `;
        if (quote.dp > 0) {
            percentHtml += '<img src="../static/images/GreenArrowUp.png" alt="Increase">';
        } else if (quote.dp < 0) {
            percentHtml += '<img src="../static/images/RedArrowDown.png" alt="Decrease">';
        }
        percentDataElement.innerHTML = percentHtml;

        document.querySelector('.strong-sell').textContent = recommendation.strongSell || '0';
        document.querySelector('.sell').textContent = recommendation.sell || '0';
        document.querySelector('.hold').textContent = recommendation.hold || '0';
        document.querySelector('.buy').textContent = recommendation.buy || '0';
        document.querySelector('.strong-buy').textContent = recommendation.strongBuy || '0';

    }

    // THis function updates the charts, I reffered the lecture one slide where professor has a sample highcarts code in the slides

    function displayCharts(price, volume, maxVolume, minVolume, search_query) {
        Highcharts.stockChart('charts', {
            title: {
                text: `Stock Price ${search_query.ticker} ${getTodaysDate()}`
            },
            subtitle: {
                text: "<a href='https://polygon.io' target=_blank' style='textDecoration: underline; color: blue;'>Source: Polygon.io</a>"
            },
            plotOptions: {
                column: {
                    pointWidth: 4,
                    pointPlacement: 'on',
                    color: "#404040"
                },
                series: {
                    pointPlacement: 'on'
                }
            },
            rangeSelector: {
                buttons: [
                    { type: "day", text: "7d", count: 7 },
                    { type: "day", text: "15d", count: 15 },
                    { type: "month", text: "1m", count: 1 },
                    { type: "month", text: "3m", count: 3 },
                    { type: "month", text: "6m", count: 6, selected: true }
                ],
                inputEnabled: false,
                allButtonsEnabled: false,
                selected: 0
            },
            yAxis: [{
                title: { text: "Volume" },
                labels: { align: "left" },
                floor: minVolume,
                max: maxVolume * 2,
                tickAmount: 6
            }, {
                title: { text: "Stock Price" },
                opposite: false,
                tickAmount: 6
            }],
            xAxis: {
                type: "datetime",
                labels: {
                    format: "{value:%e  %b}",
                },
                gapGridLineWidth: 0,
            },
            series: [{
                type: "area",
                name: "Stock Price",
                data: price,
                showInNavigator: true,
                gapSize: 0,
                yAxis: 1,
                threshold: null,
                tooltip: {
                    valueDecimals: 2
                },
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                }
            }, {
                type: "column",
                name: "Volume",
                data: volume,
                yAxis: 0,
                showInNavigator: false,
                threshold: null
            }]
        });
    }


    // Below function display the news 

    function displayNews(newsItems) {

        const template = document.querySelector('.news-container.template');
        latestNewsDetails.querySelectorAll('.news-container:not(.template)').forEach(e => e.remove());

        newsItems.forEach(item => {
            const newsClone = template.cloneNode(true);
            newsClone.classList.remove('template');
            newsClone.style.display = '';

            const img = newsClone.querySelector('.news-image img');
            img.src = item.image || '#';
            img.alt = 'news image';

            const titleContainer = newsClone.querySelector('.news-title');
            titleContainer.innerHTML = '';
            const titleStrong = document.createElement('strong');
            titleStrong.textContent = item.headline || 'N/A';
            titleContainer.appendChild(titleStrong);

            const date = newsClone.querySelector('.news-date');
            date.textContent = item.datetime || 'N/A';

            const url = newsClone.querySelector('.news-url a');
            url.href = item.url || '#';
            url.textContent = 'See Original Post';

            latestNewsDetails.appendChild(newsClone);
        });
    }

});

