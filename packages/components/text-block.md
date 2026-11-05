# Plain text reading block

`createTextBlock({document,label,text,copyable:true,i18n})` returns `{element,content,value,setText,selectAll,copy,dispose}`. Content is literal text, never parsed HTML. It preserves line breaks and wraps long words. Use Markdown/code viewers for structured documents.

Focus/click the reading surface. The first Ctrl+A or Cmd+A selects the block; a second distinct press within 600ms selects the document body. Held-key repeats never escalate. Blur, pointer activation, other keys and replaced content reset the gesture. Native nested fields/editors/buttons/links keep their own shortcuts. No document-wide key handler is installed. 600ms is an authored AG interaction default, not a platform standard.

`copyable` defaults false. When true a familiar quiet copy icon appears below the block with a localized accessible name and browser title. No clipboard permission/write occurs during render. The explicit copy action copies the whole accepted text, preserves line breaks, announces success, and on denial focuses/selects the block with manual-copy guidance. Stale async writes do not label newer content as copied. Dispose removes listeners/locale subscription and ignores late completion. The host owns sensitive content, persistence and clipboard policy.

All colors use AG semantic tokens; RU/EN are supplied by the shared i18n context. Native/AT qualification and other consumer integrations remain separate.
