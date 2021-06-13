std := load('../vendor/std')
json := load('../vendor/json')

log := std.log
f := std.format
each := std.each
readFile := std.readFile
serJSON := json.ser
deJSON := json.de

http := load('../vendor/http')
mimeForPath := load('../vendor/mime').forPath

github := load('../lib/github')
getRepo := github.getRepo
getContents := github.getContents

Port := 9870

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

` directory traversal paths `
addRoute('/repo/:userName/:repoName/files/*pathName', params => (req, end) => req.method :: {
	'GET' -> getContents(
		params.userName + '/' + params.repoName
		'/' + params.pathName
		contents => contents :: {
			() -> end(NotFound)
			_ -> (
				end({
					status: 200
					headers: {'Content-Type': 'text/plain'}
					body: serJSON(contents)
				})
			)
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
					body: serJSON(contents)
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
		_ -> (
			end({
				status: 200
				headers: {'Content-Type': 'application/json'}
				body: serJSON(repo)
			})
		)
	})
	_ -> end(MethodNotAllowed)
})

addRoute('/fileproxy/*githubURL', params => (req, end) => req.method :: {
	'GET' -> req(params.githubURL, evt => evt.type :: {
		'resp' -> end({
			status: 200
			headers: {'Content-Type': 'text/plain'}
			body: evt.data.body
		})
		'error' -> end({
			status: 500
			headers: {'Content-Type': 'text/plain'}
			body: evt.message
		})
	})
	_ -> end(MethodNotAllowed)
})

` static paths `
addRoute('/static/*staticPath', params => serveStatic(params.staticPath))
addRoute('/favicon.ico', params => serveStatic('favicon.ico'))
addRoute('/', params => serveStatic('index.html'))

start := () => (
	end := (server.start)(Port)
	log(f('Kin started, listening on 0.0.0.0:{{0}}', [Port]))
)

start()

