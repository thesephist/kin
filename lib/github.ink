` GitHub API `

std := load('../vendor/std')

log := std.log
f := std.format

json := load('../vendor/json')
serJSON := json.ser
deJSON := json.de

cache := load('cache')
secrets := load('../secrets')

AccessToken := secrets.AccessToken
APIRoot := 'https://api.github.com'
GitHubV3Accept := 'application/vnd.github.v3+json'
UserAgent := 'ink, dotink.co'

Cache := (cache.new)()
cacheGet := Cache.get

getAPI := (path, withResp) => (
	request := {
		url: APIRoot + path
		headers: {
			'Accept': GitHubV3Accept
			'User-Agent': UserAgent
			'Authorization': 'token ' + AccessToken
		}
	}
	cacheGet(request, resp => withResp(resp))
)

` Get repository JSON with name as user/repo `
getRepo := (name, withRepo) => (
	getAPI('/repos/' + name, resp => resp :: {
		() -> withRepo(())
		_ -> withRepo(deJSON(resp))
	})
)

getContents := (name, path, withContents) => (
	getAPI(
		f('/repos/{{ 0 }}/contents{{ 1 }}', [name, path])
		resp => resp :: {
			() -> withContents(())
			_ -> withContents(deJSON(resp))
		}
	)
)

