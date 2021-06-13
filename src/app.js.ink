` Main application UI `

std := load('std')
log := std.log
f := std.format

json := load('json')
serJSON := json.ser
deJSON := json.de

` utilities `

fetchAPI := (url, data, withRespJSON) => (
	resp := fetch(url, data)
	json := bind(resp, 'then')(resp => bind(resp, 'json')())
	bind(json, 'then')(data => withRespJSON(data))
)

fetchRepo := (userName, repoName, withRepo) => fetchAPI(
	f('/repo/{{ 0 }}/{{ 1 }}', [userName, repoName])
	{}
	data => withRepo(data)
)

fetchContents := (userName, repoName, path, withContents) => fetchAPI(
	f('/repo/{{ 0 }}/{{ 1 }}/files{{ 2 }}', [userName, repoName, path])
	{}
	data => withContents(data)
)

translateFileFromAPI := fileFromAPI => {
	open?: false
	name: fileFromAPI.name
	path: fileFromAPI.path
	type: fileFromAPI.type
	download: fileFromAPI.'download_url'
	content: ()
	children: ()
}

` UI components `

Link := (name, href) => ha('a', [], {href: href, target: '_blank'}, [name])

` TODO: repo view `
RepoPanel := () => repo := State.repo :: {
	() -> h('div', ['repo-panel', 'empty'], [
		'Loading repo...'
	])
	_ -> h('div', ['repo-panel'], [
		h('div', ['repo-info-line'], [repo.owner.username])
		h('div', ['repo-info-line'], [repo.description])
		h('div', ['repo-info-line'], [Link(repo.homepage, repo.homepage)])
		h('div', ['repo-info-line'], [repo.language])
	])
}

FileTreeNode := file => h('div', ['file-tree-node'], [
	file.type :: {
		'dir' -> hae('button', ['file-tree-node-toggle'], {}, {
			click: evt => (
				` TODO: toggle this node `
				file.open? := ~(file.open?)
				fetchFileChildren(file, render)
				render()
			)
		}, [file.open? :: {true -> 'v', _ -> '>'}])
		_ -> ()
	}
	hae('button', ['file-tree-node-file'], {}, {}, [file.name])
	file.open? :: {
		false -> ()
		_ -> file.children :: {
			() -> 'Loading files...'
			_ -> FileTreeList(file.children)
		}
	}
])

FileTreeList := files => h('ul', ['file-tree-list'], (
	sortedFiles := sortBy(clone(files), file => file.name)
	map(sortedFiles, file => h('li', ['file-tree-list-item'], [
		FileTreeNode(file)
	]))
))

Sidebar := () => h('div', ['sidebar'], [
	h('nav', [], [
		ha('a', [], {href: '/'}, ['Ink codebase browser'])
	])
	RepoPanel()
	FileTreeList(State.files)
])

` TODO: file view `
FilePanel := file => (
	()
)

FileArea := () => h('div', ['file-area'], (
	map(State.openFiles, file => FilePanel(file))
))

root := bind(document, 'querySelector')('#root')
r := Renderer(root)
update := r.update

State := {
	theme: 'light'
	userName: 'thesephist'
	repoName: 'september'
	` {
		owner: {
			username: string
			avatar: string
			url: string
		}
		description: string
		homepage: string
		language: string
	} `
	repo: ()
	` List<{
		open?: boolean
		name: string
		path: string
		type: 'file' | 'dir' | ...
		download: string
		content: string | ()
		children: typeof State.files | ()
	}> `
	files: []
	openFiles: []
}

refreshRepo := () => (
	` TODO: at some point, this translation should move to backend `
	fetchRepo(State.userName, State.repoName, repo => (
		State.repo := {
			owner: {
				username: repo.owner.login
				avatar: repo.owner.'avatar_url'
				url: repo.owner.'html_url'
			}
			description: repo.description
			homepage: repo.homepage
			language: repo.language
		}
		render()
	))
	fetchContents(State.userName, State.repoName, '/', contents => (
		State.files := map(contents, translateFileFromAPI)
	))
)

fetchFileChildren := (file, cb) => (
	` must mutate file in-place, return value does not matter `
	fetchContents(State.userName, State.repoName, '/' + file.path, contents => (
		file.children := map(contents, translateFileFromAPI)
		cb()
	))
)

render := () => update(h(
	'div'
	['app']
	[
		Sidebar()
		FileArea()
	]
))

refreshRepo()
render()

