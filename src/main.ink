std := load('../vendor/std')
str := load('../vendor/str')
json := load('../vendor/json')

log := std.log
f := std.format
range := std.range
cat := std.cat
map := std.map
each := std.each
readFile := std.readFile
split := str.split
replace := str.replace
hasSuffix? := str.hasSuffix?
serJSON := json.ser
deJSON := json.de

http := load('../vendor/http')
mimeForPath := load('../vendor/mime').forPath

github := load('../lib/github')
getRepo := github.getRepo
getContents := github.getContents

highlight := load('highlight')
highlightInkProg := highlight.highlightInkProg

Port := 9870
Newline := char(10)

server := (http.new)()
NotFound := {status: 404, body: 'file not found'}
MethodNotAllowed := {status: 405, body: 'method not allowed'}

serveStatic := path => (req, end) => req.method :: {
	'GET' -> readFile('static/' + path, file => file :: {
		() -> end(NotFound)
		_ -> end({
			status: 200
			headers: {'Content-Type': mimeForPath(path)}
			body: file
		})
	})
	_ -> end(MethodNotAllowed)
}

addRoute := server.addRoute

translateFileFromAPI := fileFromAPI => {
	name: fileFromAPI.name
	path: fileFromAPI.path
	type: fileFromAPI.type
	size: fileFromAPI.size
	download: fileFromAPI.'download_url'
	content: ()
	children: ()
}

` directory traversal paths `
addRoute('/repo/:userName/:repoName/files/*pathName', params => (req, end) => req.method :: {
	'GET' -> getContents(
		params.userName + '/' + params.repoName
		'/' + params.pathName
		contents => contents :: {
			() -> end(NotFound)
			_ -> end({
				status: 200
				headers: {'Content-Type': 'text/plain'}
				body: serJSON(map(contents, translateFileFromAPI))
			})
		}
	)
	_ -> end(MethodNotAllowed)
})
addRoute('/repo/:userName/:repoName/files', params => (req, end) => req.method :: {
	'GET' -> getContents(
		params.userName + '/' + params.repoName
		'/'
		contents => contents :: {
			() -> end(NotFound)
			_ -> (
				end({
					status: 200
					headers: {'Content-Type': 'text/plain'}
					body: serJSON(map(contents, translateFileFromAPI))
				})
			)
		}
	)
	_ -> end(MethodNotAllowed)
})

` repo read paths `
addRoute('/repo/:userName/:repoName', params => (req, end) => req.method :: {
	'GET' -> getRepo(params.userName + '/' + params.repoName, repo => repo :: {
		() -> end(NotFound)
		_ -> end({
			status: 200
			headers: {'Content-Type': 'application/json'}
			body: serJSON({
				owner: {
					username: repo.owner.login
					avatar: repo.owner.'avatar_url'
					url: repo.owner.'html_url'
				}
				description: repo.description
				homepage: repo.homepage
				language: repo.language
				branch: repo.'default_branch'
			})
		})
	})
	_ -> end(MethodNotAllowed)
})

addRoute('/embed/*githubURL', params => (request, end) => request.method :: {
	'GET' -> req(
		{
			` URL processing seems to trim double-slashes `
			url: replace(params.githubURL, 'https:/', 'https://')
		}
		evt => evt.type :: {
			'resp' -> readFile('./static/embed.html', file => file :: {
				() -> end({
					status: 500
					headers: {'Content-Type': 'text/plain'}
					body: evt.message
				})
				_ -> end({
					status: 200
					headers: {'Content-Type': 'text/html'}
					body: f(file, {
						fileName: params.githubURL
						lineNos: cat(map(
							range(1, len(split(evt.data.body, Newline)) + 1, 1)
							string
						), Newline)
						prog: hasSuffix?(params.githubURL, '.ink') :: {
							true -> highlightInkProg(evt.data.body)
							_ -> evt.data.body
						}
					})
				})
			})
			'error' -> end({
				status: 500
				headers: {'Content-Type': 'text/plain'}
				body: evt.message
			})
		}
	)
	_ -> end(MethodNotAllowed)
})

` static paths `
addRoute('/static/*staticPath', params => serveStatic(params.staticPath))
addRoute('/favicon.ico', params => serveStatic('favicon.ico'))
addRoute('/demo', params => serveStatic('demo.html'))
addRoute('/', params => serveStatic('index.html'))

start := () => (
	end := (server.start)(Port)
	log(f('Kin started, listening on 0.0.0.0:{{0}}', [Port]))
)

start()

