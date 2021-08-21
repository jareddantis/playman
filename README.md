# playman

## Project setup
```
(npm|yarn) install
```

### Compile for development (with hot-reloads)

The Netlify Functions module reads variables from the environment, which in this case we use to store Spotify authentication tokens and API endpoints.
Before you try serving Playman, make sure you have these environment variables set:

|Config key|Description|
|-----|-----|
|`API_URL`|Spotify API URL prefix. Currently `https://api.spotify.com/v1`|
|`SPID`|Spotify client ID|
|`SPSC`|Spotify client secret|

Once you have these variables set, you can invoke
```
(npm|yarn) run serve
```

### Compile for production (with minification)
```
(npm|yarn) run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
