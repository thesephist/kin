` Main application UI `

std := load('std')
log := std.log
f := std.format

json := load('json')
serJSON := json.ser
deJSON := json.de

Newline := char(10)

` utilities `

fetchAPI := (url, data, withRespJSON) => (
	resp := fetch(url, data)
	` TODO: handle errors -- non-200 responses `
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

` initial state `

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

` UI components `

Link := (name, href) => ha('a', [], {href: href, target: '_blank'}, [name])

RepoPanel := (
	state := {
		userName: State.userName
		repoName: State.repoName
	}

	() => h('div', ['repo-panel'], [
		h('div', ['repo-input-panel'], [
			hae(
				'input', ['repo-input-username']
				{value: state.userName}
				{
					input: evt => (
						state.userName := evt.target.value
						render()
					)
				}
				[]
			)
			hae(
				'input', ['repo-input-reponame']
				{value: state.repoName}
				{
					input: evt => (
						state.repoName := evt.target.value
						render()
					)
				}
				[]
			)
			hae('button', ['repo-input-submit'], {}, {
				click: () => (
					State.userName := state.userName
					State.repoName := state.repoName
					refreshRepo()
				)
			}, ['Go'])
		])
		repo := State.repo :: {
			() -> h('div', ['repo-info-panel', 'empty'], [
				'Loading repo...'
			])
			_ -> h('div', ['repo-info-panel'], [
				h('div', ['repo-info-line'], [repo.owner.username])
				h('div', ['repo-info-line'], [repo.description])
				h('div', ['repo-info-line'], [Link(repo.homepage, repo.homepage)])
				h('div', ['repo-info-line'], [repo.language])
			])
		}
	])
)

FileTreeNode := file => h('div', ['file-tree-node'], [
	file.type :: {
		'dir' -> hae('button', ['file-tree-node-toggle'], {}, {
			click: () => (
				` TODO: toggle this node `
				file.open? := ~(file.open?)
				fetchFileChildren(file, render)
				render()
			)
		}, [file.open? :: {true -> 'v', _ -> '>'}])
		_ -> ()
	}
	hae('button', ['file-tree-node-file'], {}, {
		click: () => file.type :: {
			'file' -> (
				State.openFiles.len(State.openFiles) := file
				fetchFileContent(file, render)
				render()
			)
		}
	}, [file.name])
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

FileLine := (n, line) => h('code', ['file-line'], [
	h('span', ['file-line-no'], [n])
	h('span', ['file-line-text'], [line])
])

FilePanel := file => h('div', ['file-panel'], [
	h('div', ['file-panel-header'], [
		h('div', ['file-panel-header-info'], [
			h('span', ['file-panel-header-path'], [trimSuffix(file.path, file.name)])
			h('span', ['file-panel-header-name'], [file.name])
		])
		hae('button', ['file-panel-close'], {}, {
			click: () => (
				State.openFiles := filter(State.openFiles, f => ~(f = file))
				render()
			)
		}, ['x'])
	])
	file.content :: {
		() -> h('pre', ['file-panel-code', 'loading'], [])
		_ -> h(
			'pre'
			['file-panel-code']
			map(split(file.content, Newline), (line, i) => FileLine(i + 1, line))
		)
	}
])

FileArea := () => h('div', ['file-area'], (
	map(State.openFiles, file => FilePanel(file))
))

` globals and callbacks `

root := bind(document, 'querySelector')('#root')
r := Renderer(root)
update := r.update

refreshRepo := () => (
	State.repo := ()
	State.files := []
	State.openFiles := []
	render()

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
		render()
	))
)

fetchFileChildren := (file, cb) => file.children :: {
	() -> (
		` must mutate file in-place, return value does not matter `
		fetchContents(State.userName, State.repoName, '/' + file.path, contents => (
			file.children := map(contents, translateFileFromAPI)
			cb()
		))
	)
	_ -> cb()
}

fetchFileContent := (file, cb) => file.content :: {
	() -> (
		` TODO: use the fileproxy later for syntax highlighting, etc `
		resp := fetch(file.download)
		` TODO: what if not text file? `
		text := bind(resp, 'then')(resp => bind(resp, 'text')())
		bind(text, 'then')(text => (
			file.content := text
			cb()
		))
	)
	_ -> cb()
}

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

