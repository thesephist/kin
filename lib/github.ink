` GitHub API `

std := load('../vendor/std')

log := std.log
f := std.format

json := load('../vendor/json')
serJSON := json.ser
deJSON := json.de

AccessToken := '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'
APIRoot := 'https://api.github.com'
GitHubV3Accept := 'application/vnd.github.v3+json'
UserAgent := 'ink, dotink.co'

getAPI := (path, withResp) => (
	log(f('[api] GET {{ 0 }}', [path]))
	request := {
		url: APIRoot + path
		headers: {
			'Accept': GitHubV3Accept
			'User-Agent': UserAgent
			'Authorization': 'token ' + AccessToken
		}
	}

	req(request, evt => evt.type :: {
		'resp' -> statusCode := evt.data.status :: {
			200 -> withResp(evt.data.body)
			_ -> log('[err] response status ' + string(statusCode))
		}
		'error' -> (
			log('[err] ' + evt.message)
			withResp(())
		)
	})
)

` Get repository JSON with name as user/repo `
getRepo := (name, withRepo) => (
	getAPI('/repos/' + name, resp => withRepo(deJSON(resp)))
)

getContents := (name, path, withContents) => (
	getAPI(
		f('/repos/{{ 0 }}/contents{{ 1 }}', [name, path])
		resp => withContents(deJSON(resp))
	)
)

