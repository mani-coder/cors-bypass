### How to use CORS bypass?

CORS ByPass URL: https://us-central1-mani-coder.cloudfunctions.net/cors-bypass/

Just append the original URL to end of the CORS bypass URL and you are good to go. However there is a catch to this, you need to replace the double slash after http or https (http://) with single slash to make it work.

For example:
Original URL: https://portfolio.nasdaq.com/api/portfolio/getPortfolioEvents/?fromDate=2021-10-16&toDate=2022-02-16&tickers=BIDU

To fetch data using cors-bypass, you need to use the URL like below:
https://us-central1-mani-coder.cloudfunctions.net/cors-bypass/https:/portfolio.nasdaq.com/api/portfolio/getPortfolioEvents/?fromDate=2021-10-16&toDate=2022-02-16&tickers=BIDU

Simply you have to do this in your code:
https://us-central1-mani-coder.cloudfunctions.net/cors-bypass/<url_to_fetch_data.replace('//', '/')>

```
export function buildCorsFreeUrl(target: string): string {
  return `https://us-central1-mani-coder.cloudfunctions.net/cors-bypass/${target.replace('//', '/')}`;
}
```
