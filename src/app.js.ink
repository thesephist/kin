` Main application UI `

std := load('std')
log := std.log
f := std.format

` constants `

Newline := char(10)
MaxPathChars := 16

` TODO: support Markdown previews `
FileType := {
	` cannot display `
	Blob: ~1
	` code `
	Text: 0
	` preview `
	Image: 1
}

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

fileInWorkspace? := file => (
	allOpenFiles := flatten(map(State.panes, pane => pane.files))
	(sub := i => i :: {
		len(allOpenFiles) -> false
		_ -> allOpenFiles.(i) :: {
			file -> true
			_ -> sub(i + 1)
		}
	})(0)
)

fileTypeFromPath := path => true :: {
	hasSuffix?(path, '.jpg') -> FileType.Image
	hasSuffix?(path, '.png') -> FileType.Image
	hasSuffix?(path, '.gif') -> FileType.Image
	hasSuffix?(path, '.bmp') -> FileType.Image

	hasSuffix?(path, '.sqlite') -> FileType.Blob

	_ -> FileType.Text
}

getLanguage := hljs.getLanguage
listLanguages := hljs.listLanguages
highlightProg := (fileName, content) => (
	` langCode must be a JS string because highlight.js's API expects only JS
	strings, and passing an Ink-compatible string will error. `
	langCode := str(fileName :: {
		'Dockerfile' -> 'dockerfile'
		'Makefile' -> 'makefile'
		_ -> dotParts := split(fileName, '.') :: {
			` Klisp is a lisp flavor written in Ink. It's syntactically closest
			to scheme, which is in our language package. `
			[_, 'klisp'] -> 'scheme'
			[_] -> 'unknown'
			_ -> dotParts.(len(dotParts) - 1)
		}
	})

	language := (eval(str('getLanguage(langCode) || null')) :: {
		() -> langCode
		_ -> lower(getLanguage(langCode).name)
	})

	filter(listLanguages(), lg => lg = language) :: {
		[_] -> (
			result := (hljs.highlight)(content, {
				language: langCode
			})
			bind(console, 'log')(result)
			result.value
		)
		_ -> langCode :: {
			'ink' -> highlightInkProg(content)
			_ -> content
		}
	}
)

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
		editing?: false
	}

	submit := () => (
		state.editing? := false
		render()

		goTo('/' + state.userName + '/' + state.repoName)
	)

	handleKeydown := evt => evt.key :: {
		'Escape' -> render(state.editing? := false)
		'Enter' -> submit()
	}

	() => h('div', ['repo-panel'], [
		state.editing? :: {
			false -> h('div', ['repo-panel-header'], [
				h('div', ['repo-header-link'], [
					Link(
						f('{{ userName }}/{{ repoName }}', State)
						f('https://github.com/{{ userName }}/{{ repoName }}', State)
					)
				])
				hae('button', ['repo-toggle-input'], {}, {
					click: evt => (
						state.editing? := ~(state.editing?)
						state.editing? :: {
							true -> (
								state.userName := State.userName
								state.repoName := State.repoName
							)
						}
						render()
					)
				}, ['edit'])
			])
			true -> h('div', ['repo-input-panel'], [
				hae(
					'input', ['repo-input-username']
					{
						value: state.userName
						placeholder: 'username'
					}
					{
						input: evt => (
							state.userName := evt.target.value
							render()
						)
						keydown: handleKeydown
					}
					[]
				)
				hae(
					'input', ['repo-input-reponame']
					{
						value: state.repoName
						placeholder: 'repo name'
					}
					{
						input: evt => (
							state.repoName := evt.target.value
							render()
						)
						keydown: handleKeydown
					}
					[]
				)
				hae('button', ['repo-input-submit'], {}, {click: submit}, ['Go'])
			])
		}
		repo := State.repo :: {
			() -> h('div', ['repo-info-panel', 'loading'], [])
			_ -> h('div', ['repo-info-panel'], [
				h('div', ['repo-info-description'], [repo.description])
				h('div', ['repo-info-homepage'], [Link(repo.homepage, repo.homepage)])
				h('div', ['repo-info-language'], [repo.language])
			])
		}
	])
)

FileTreeNode := file => h('div', ['file-tree-node'], [
	h(
		'div'
		[
			'file-tree-node-row'
			fileInWorkspace?(file) :: {
				true -> 'in-workspace'
				_ -> ''
			}
		]
		[
			file.type :: {
				'dir' -> hae(
					'button'
					[
						'file-tree-node-toggle'
						file.open? :: {
							true -> 'open'
							_ -> 'closed'
						}
					]
					{}
					{
						click: () => (
							file.open? := ~(file.open?)
							fetchFileChildren(file, render)
							render()
						)
					}
					['▼']
				)
				_ -> ()
			}
			hae('button', ['file-tree-node-name'], {}, {
				click: () => file.type :: {
					` TODO: support multi-pane `
					'file' -> fileInWorkspace?(file) :: {
						true -> render(State.panes.'0'.active := file)
						_ -> (
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
					'dir' -> (
						file.open? := ~(file.open?)
						fetchFileChildren(file, render)
						render()
					)
				}
			}, [file.name])
		]
	)
	file.open? :: {
		false -> ()
		_ -> file.children :: {
			() -> h('div', ['file-tree-node-loading', 'loading'], [])
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
		hae('a', ['home-link'], {href: '/'}, {
			click: evt => (
				bind(evt, 'preventDefault')()
				goTo('/')
			)
		}, ['Ink codebase browser'])
	])
	RepoPanel()
	h('div', ['file-tree-list-container'], [
		FileTreeList(State.files)
	])
])

FilePreview := file => fileTypeFromPath(file.path) :: {
	FileType.Blob -> h('div', ['file-preview', 'file-preview-blob'], [
		'Can\'t preview this type of file'
	])
	FileType.Image -> h(
		'div'
		['file-preview', 'file-preview-image']
		[ha('img', ['file-preview-image-content'], {src: file.download}, [])]
	)
	FileType.Text -> content := file.content :: {
		() -> h('div', ['file-preview', 'file-preview-text'], [
			h('div', ['file-preview-loading', 'loading'], [])
		])
		_ -> h(
			'div'
			['file-preview', 'file-preview-text']
			[(
				` for performance reasons, we shell out to a JS call here. The
				Ink stdlib's str.split takes up to 100s of ms, which is
				unacceptable on renders. `
				lineCount := len(bind(str(content), 'split')(Newline)) - 1

				ha(
					'div'
					['file-preview-text-scroller']
					{
						style: {
							height: string(lineCount * 1.25 + 5) + 'em'
						}
					}
					[
						h('pre', ['file-preview-line-nos']
							[cat(map(range(1, lineCount + 1, 1), string), Newline)])
						(
							el := bind(document, 'createElement')('pre')
							el.className := 'file-preview-line-texts'
							el.innerHTML := content
						)
					]
				)
			)]
		)
	}
}

FilePane := pane => h('div', ['file-pane'], [
	h('div', ['file-pane-header'], (
		map(pane.files, file => h('div', ['file-pane-header'], [
			h(
				'div'
				[
					'file-pane-header-tab'
					pane.active :: {
						file -> 'active'
						_ -> ''
					}
				]
				[
					hae(
						'button'
						['file-pane-header-info']
						{title: file.path}
						{
							click: () => render(pane.active := file)
						}
						[
							h('span', ['file-pane-header-path'], [(
								path := trimSuffix(file.path, file.name)
								len(path) < MaxPathChars :: {
									true -> path
									_ -> '...' + slice(path, len(path) - MaxPathChars, len(path))
								}
							)])
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
					}, ['×'])
				]
			)
		]))
	))
	FilePreview(pane.active)
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
		text := bind(resp, 'then')(resp => bind(resp, 'text')())
		bind(text, 'then')(text => (
			file.content := (fileTypeFromPath(file.path) :: {
				FileType.Text -> highlightProg(file.name, text)
				_ -> text
			})
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

` router with Torus.Router `

router := jsnew(Torus.Router, [{
	githubSlash: str('/https://github.com/:userName/:repoName/')
	github: str('/https://github.com/:userName/:repoName')
	repoSlash: str('/:userName/:repoName/')
	repo: str('/:userName/:repoName')
	home: str('/')
}])

goTo := bind(router, 'go')

bind(router, 'addHandler')(
	routeInfo => (
		name := routeInfo.0
		params := routeInfo.1

		name :: {
			'repo' -> (
				State.userName := params.userName
				State.repoName := params.repoName
				refreshRepo()
				render()
			)
			'repoSlash' -> goTo('/' + params.userName + '/' + params.repoName)
			'github' -> goTo('/' + params.userName + '/' + params.repoName)
			'githubSlash' -> goTo('/' + params.userName + '/' + params.repoName)
			_ -> goTo('/thesephist/ink')
		}
	)
)

