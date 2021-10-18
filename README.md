### How to use CORS bypass?

CORS ByPass URL: https://cors.mani-coder.dev/

Just append the original URL to end of the CORS bypass URL and you are good to go. However there is a catch to this, you need to replace the double slash after http or https (http://) with single slash to make it work.

For example:
Original URL: https://example.com

To fetch data using cors-bypass, you need to use the URL like below:

```
https://cors.mani-coder.dev/https:/example.com
```

Simply you have to do this in your code:
https://cors.mani-coder.dev/<your_url.replace('//', '/')>

```
export function buildCorsFreeUrl(target: string): string {
  return `https://cors.mani-coder.dev/${target.replace('//', '/')}`;
}

fetch(
   buildCorsFreeUrl("https://api-to-fetch/")
).then(
   ...
).catch(
   ...
)
```