from flask import Flask, request, jsonify, redirect, url_for
from flask import request, jsonify
import requests
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta
import finnhub

app = Flask(__name__, static_folder='static')
finnhub_client = finnhub.Client(api_key="cn5vh49r01qo3qc0cgf0cn5vh49r01qo3qc0cgfg")
api_key = 'dkp5gqpPpUv_fqkSqndn0sLojPbhOkol'  


def fetch_stock_data_for_highcharts(stockTicker, api_key):
    from_date = datetime.now() - relativedelta(months=6, days=1)
    to_date = datetime.now()

    from_date_unix = int(time.mktime(from_date.timetuple()) * 1000)
    to_date_unix = int(time.mktime(to_date.timetuple()) * 1000)

    multiplier = 1
    timespan = 'day'
    url = f'https://api.polygon.io/v2/aggs/ticker/{stockTicker}/range/{multiplier}/{timespan}/{from_date_unix}/{to_date_unix}?adjusted=true&sort=asc&apiKey={api_key}'

    # API request
    response = requests.get(url)
    data = response.json()

    price_data = []
    volume_data = []

    if 'results' in data:
        # Loop through each item in the response to extract date, close price, and volume
        for item in data['results']:
            date = item['t']
            close_price = item['c']
            volume = item['v']

            price_data.append([date, close_price])
            volume_data.append([date, volume])
    else:
        print("No data found or there was an error fetching the data.")

 
    return price_data, volume_data


def is_valid_news_item(item):
    required_keys = ['image', 'url', 'headline', 'datetime']
    return all(key in item and item[key] for key in required_keys)

def fetch_company_news(symbol):
    today_date = datetime.now().strftime('%Y-%m-%d')
    thirty_days_ago = (datetime.now() - relativedelta(days=30)).strftime('%Y-%m-%d')

    try:
        news_items = finnhub_client.company_news(symbol, _from=thirty_days_ago, to=today_date)
        filtered_news = [item for item in news_items if is_valid_news_item(item)]
        valid_news = filtered_news[:5]
        for news in valid_news:
            news['datetime'] = datetime.fromtimestamp(news['datetime']).strftime('%d %B, %Y')
        
        return valid_news

    except Exception as e:
        print(f"Error fetching company news: {e}")
        return []


@app.route("/", methods=['GET'])
def home():
    search_query = request.args.get('query', '').upper()
    if search_query:
        try:
            output = finnhub_client.company_profile2(symbol=str(search_query))
            quote = finnhub_client.quote(symbol=str(search_query))
            recommendation = finnhub_client.recommendation_trends(symbol=str(search_query))
            news = fetch_company_news(str(search_query))
            price_data, volume_data = fetch_stock_data_for_highcharts(search_query, api_key)
            if output:
                recommendation_output = recommendation[0] if recommendation else {}
                return jsonify({
                    'is_valid': True, 
                    'search_query': output, 
                    'quote': quote, 
                    'recommendation': recommendation_output, 
                    'news': news,
                    'price': price_data,
                    'volume': volume_data
                })
            else:
                return jsonify({'is_valid': False})
        except Exception as e:
            print(f"Error processing search query: {e}")
            return jsonify({'is_valid': False, 'error': str(e)})
    else:
        return app.send_static_file("base.html")


# @app.route("/", methods=['GET'])  # Change to GET
# def search():
#     search_query = request.args.get('query', '').upper()  # Access query parameter
#     try:
#         output = finnhub_client.company_profile2(symbol=str(search_query))
#         quote = finnhub_client.quote(symbol=str(search_query))
#         recommendation = finnhub_client.recommendation_trends(symbol=str(search_query))
#         news = fetch_company_news(str(search_query))
#         price_data, volume_data = fetch_stock_data_for_highcharts(search_query, api_key)
#         if output:
#             recommendation_output = recommendation[0] if recommendation else {}
#             return jsonify({
#                 'is_valid': True, 
#                 'search_query': output, 
#                 'quote': quote, 
#                 'recommendation': recommendation_output, 
#                 'news': news,
#                 'price': price_data,
#                 'volume': volume_data
#             })
#         else:
#             return jsonify({'is_valid': False})
#     except Exception as e:
#         print(f"Error processing search query: {e}")
#         return jsonify({'is_valid': False, 'error': str(e)})

@app.errorhandler(405)
def handle_405(error):
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True)











