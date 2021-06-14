` HTTP request LR cache `

std := load('../vendor/std')

log := std.log
f := std.format
reduce := std.reduce

` Max number of requests that will be cached `
MaxSize := 50
` Number of seconds after which the request must be re-ferched `
ExpirySecs := 60

` Create a new cache `
new := () => (
	` Map<url: string, {
		timestamp: number
		data: number
	}> `
	cache := {}

	cached? := request => cachedResp := cache.(request.url) :: {
		() -> false
		_ -> cachedResp.timestamp + ExpirySecs < time() :: {
			true -> false
			_ -> true
		}
	}

	evictLR := () => (
		oldest := reduce(keys(cache), (oldest, k) => entry := cache.(k) :: {
			() -> oldest
			_ -> entry.timestamp < oldest.timestamp :: {
				true -> {
					url: k
					timestamp: entry.timestamp
				}
				_ -> oldest
			}
		}, {url: '//invalid', timestamp: time() + 1})

		log(f('[cache] evict {{ url }}', oldest))
		cache.(oldest.url) := ()
	)

	get := (request, cb) => cached?(request) :: {
		true -> cb(cache.(request.url).data)
		_ -> (
			withResp := resp => (
				cache.(request.url) := {
					timestamp: time()
					data: resp
				}
				len(cache) > MaxSize :: {
					true -> evictLR()
				}
				cb(resp)
			)

			log(f('[api] GET {{ 0 }}', [request.url]))
			req(request, evt => evt.type :: {
				'resp' -> statusCode := evt.data.status :: {
					200 -> withResp(evt.data.body)
					_ -> (
						log('[err] response status ' + string(statusCode))
						withResp(())
					)
				}
				'error' -> (
					log('[err] ' + evt.message)
					withResp(())
				)
			})
		)
	}

	{
		get: get
	}
)
