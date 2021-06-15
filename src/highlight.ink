` september syntax highlighter command, forked to highlight HTML elements `

std := load('../vendor/std')

log := std.log
f := std.format
map := std.map
each := std.each
slice := std.slice
cat := std.cat

Tokenize := load('tokenize')
Tok := Tokenize.Tok
tokenize := Tokenize.tokenizeWithComments

` associating token types with their highlight colors `
classForTok := tok => tok.type :: {
	Tok.Separator -> 'hljs-separator'

	Tok.Comment -> 'hljs-comment'

	Tok.Ident -> ''
	Tok.EmptyIdent -> ''

	Tok.NumberLiteral -> 'hljs-number'
	Tok.StringLiteral -> 'hljs-string'
	Tok.TrueLiteral -> 'hljs-literal'
	Tok.FalseLiteral -> 'hljs-literal'

	Tok.AccessorOp -> 'hljs-operator'
	Tok.EqOp -> 'hljs-operator'

	Tok.FunctionArrow -> 'hljs-operator'

	` operators are all red `
	Tok.KeyValueSeparator -> 'hljs-operator'
	Tok.DefineOp -> 'hljs-operator'
	Tok.MatchColon -> 'hljs-operator'
	Tok.CaseArrow -> 'hljs-operator'
	Tok.SubOp -> 'hljs-operator'
	Tok.NegOp -> 'hljs-operator'
	Tok.AddOp -> 'hljs-operator'
	Tok.MulOp -> 'hljs-operator'
	Tok.DivOp -> 'hljs-operator'
	Tok.ModOp -> 'hljs-operator'
	Tok.GtOp -> 'hljs-operator'
	Tok.LtOp -> 'hljs-operator'
	Tok.AndOp -> 'hljs-operator'
	Tok.OrOp -> 'hljs-operator'
	Tok.XorOp -> 'hljs-operator'

	Tok.LParen -> 'hljs-punctuation'
	Tok.RParen -> 'hljs-punctuation'
	Tok.LBracket -> 'hljs-punctuation'
	Tok.RBracket -> 'hljs-punctuation'
	Tok.LBrace -> 'hljs-punctuation'
	Tok.RBrace -> 'hljs-punctuation'

	_ -> () `` should error, unreachable
}

escapeHTML := s => replace(replace(s, '&', '&amp;'), '<', '&lt;')

highlightInkProg := prog => (
	tokens := tokenize(prog)
	spans := map(tokens, (tok, i) => {
		class: [tok.type, tokens.(i + 1)] :: {
			` direct function calls are marked green
				on a best-effort basis `
			[
				Tok.Ident
				{type: Tok.LParen, val: _, line: _, col: _, i: _}
			] -> 'hljs-title function_'
			_ -> classForTok(tok)
		}
		start: tok.i
		end: tokens.(i + 1) :: {
			() -> len(prog)
			_ -> tokens.(i + 1).i
		}
	})
	pcs := map(
		spans
		span => '<span class="' + span.class + '">' +
			escapeHTML(slice(prog, span.start, span.end)) + '</span>'
	)
	cat(pcs, '')
)
