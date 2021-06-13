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
	` List<File: {
		open?: boolean
		name: string
		path: string
		type: 'file' | 'dir' | ...
		download: string
		content: string | ()
		children: List<File> | ()
	}> `
	files: []
	` List<Pane: {
		active: File
		files: List<File>
	}> `
	panes: []
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
				` TODO: support multi-pane `
				pane := State.panes.0 :: {
					() -> State.panes := [{
						active: file
						files: [file]
					}]
					_ -> (
						pane.files.len(pane.files) := file
						pane.active := file
					)
				}
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

FilePane := pane => h('div', ['file-pane'], [
	h('div', ['file-pane-header'], (
		map(pane.files, file => h('div', ['file-pane-header'], [
			h('div', ['file-pane-header-tab'], [
				hae(
					'button'
					['file-pane-header-info']
					{title: file.path}
					{
						click: () => render(pane.active := file)
					}
					[
						h('span', ['file-pane-header-path'], [trimSuffix(file.path, file.name)])
						h('span', ['file-pane-header-name'], [file.name])
					]
				)
				hae('button', ['file-pane-close'], {}, {
					click: () => (
						pane.files := filter(pane.files, f => ~(f = file))
						pane.files :: {
							` if pane is empty, remove pane from panes `
							[] -> State.panes := filter(State.panes, p => ~(p = pane))
							` otherwise, set active pane file to something else `
							_ -> pane.active :: {
								` if current file was active, choose a different active file `
								file -> pane.active := pane.files.0
							}
						}
						render()
					)
				}, ['x'])
			])
		]))
	))
	content := pane.active.content :: {
		() -> h('pre', ['file-pane-code', 'loading'], [])
		_ -> h(
			'pre'
			['file-pane-code']
			map(split(content, Newline), (line, i) => FileLine(i + 1, line))
		)
	}
])

FilePanes := () => h(
	'div'
	['file-panes']
	map(State.panes, pane => FilePane(pane))
)

` globals and callbacks `

root := bind(document, 'querySelector')('#root')
r := Renderer(root)
update := r.update

refreshRepo := () => (
	State.repo := ()
	State.files := []
	State.panes := []
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
		FilePanes()
	]
))

refreshRepo()
render()

