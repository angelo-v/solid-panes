/*   Human-readable editable "Dokieli" Pane
**
**  This outline pane contains the document contents for a Dokieli document
** The dokeili system allows the user to edit a document including anotations
** review.   It does not use turtle, but RDF/a
*/
var UI = require('solid-ui')

// const DOKIELI_TEMPLATE_URI = 'https://dokie.li/new' // Copy to make new dok

const DOKIELI_TEMPLATE = require('./new.js') // Distributed with this library

module.exports = {
  icon: UI.icons.iconBase + 'dokieli-logo.png', // @@ improve? more like doccument?

  name: 'Dokieli',

  mintClass: UI.ns.solid('DokieliDocument'), // @@ A better class?

  label: function (subject, myDocument) {
    // Prevent infinite recursion with iframe loading a web page which uses tabulator which shows iframe...
    if (tabulator.isExtension && myDocument.location === subject.uri) return null
    var kb = UI.store
    var ns = UI.ns

    //   See aslo tthe source pane, which has lower precedence.

    var allowed = [ // 'text/plain',
      'text/html', 'application/xhtml+xml'
    // 'image/png', 'image/jpeg', 'application/pdf',
    // 'video/mp4'
    ]

    var hasContentTypeIn = function (kb, x, displayables) {
      var cts = kb.fetcher.getHeader(x, 'content-type')
      if (cts) {
        for (var j = 0; j < cts.length; j++) {
          for (var k = 0; k < displayables.length; k++) {
            if (cts[j].indexOf(displayables[k]) >= 0) {
              return true
            }
          }
        }
      }
      return false
    }

    // This data coul d come from a fetch OR from ldp comtaimner
    var hasContentTypeIn2 = function (kb, x, displayables) {
      var t = kb.findTypeURIs(subject)
      for (var k = 0; k < displayables.length; k++) {
        if ($rdf.Util.mediaTypeClass(displayables[k]).uri in t) {
          return true
        }
      }
      return false
    }

    if (!subject.uri) return null // no bnodes

    var t = kb.findTypeURIs(subject)
    if (t[ns.link('WebPage').uri]) return 'view'

    if (hasContentTypeIn(kb, subject, allowed) ||
      hasContentTypeIn2(kb, subject, allowed)) return 'Dok'

    return null
  },

  // Create a new folder in a Solid system, with a dokieli editable document in it
  mintNew: function (newPaneOptions) {
    var kb = UI.store
    var newInstance = newPaneOptions.newInstance || kb.sym(newPaneOptions.newBase)
    console.log('New dok called with ' + newInstance)
    var u = newInstance.uri
    if (u.endsWith('/')) {
      u = u + 'index.html'
    }
    if (!u.endsWith('.html')) {
      u = u + '.html'
    }
    newPaneOptions.newInstance = newInstance = kb.sym(u)
    console.log('New dok will make: ' + newInstance)
    /*
    return new Promise(function(resolve, reject){
      kb.fetcher.webCopy(DOKIELI_TEMPLATE_URI, newInstance.uri, 'text/html')
      .then(function(){
        console.log('new Dokieli document created at ' + newPaneOptions.newInstance)
        resolve(newPaneOptions)
      }).catch(function(err){
        console.log('Error creating dokelili dok at ' +
            newPaneOptions.newInstance + ': ' + err )
      })
    })
    */

    return new Promise(function (resolve, reject) {
      kb.fetcher.webOperation('PUT', newInstance.uri, { data: DOKIELI_TEMPLATE, contentType: 'text/html' })
        .then(function () {
          console.log('new Dokieli document created at ' + newPaneOptions.newInstance)
          resolve(newPaneOptions)
        }).catch(function (err) {
          console.log('Error creating dokelili dok at ' +
            newPaneOptions.newInstance + ': ' + err)
        })
    })
  },

  // Derived from: humanReadablePane .. share code?
  render: function (subject, myDocument) {
    var div = myDocument.createElement('div')
    var kb = UI.store

    //  @@ When we can, use CSP to turn off scripts within the iframe
    div.setAttribute('class', 'docView')
    var iframe = myDocument.createElement('IFRAME')
    iframe.setAttribute('src', subject.uri) // allow-same-origin
    iframe.setAttribute('class', 'doc')

    var cts = kb.fetcher.getHeader(subject.doc(), 'content-type')
    var ct = cts ? cts[0] : null
    if (ct) {
      console.log('humanReadablePane: c-t:' + ct)
    } else {
      console.log('humanReadablePane: unknown content-type?')
    }

    // @@ NOte beflow - if we set ANY sandbox, then Chrome and Safari won't display it if it is PDF.
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
    // You can;'t have any sandbox and allow plugins.
    // We could sandbox only HTML files I suppose.
    // HTML5 bug: https://lists.w3.org/Archives/Public/public-html/2011Jun/0330.html

    // iframe.setAttribute('sandbox', 'allow-same-origin allow-forms'); // allow-scripts ?? no documents should be static

    iframe.setAttribute('style', 'resize = both; height: 120em; width:80em;')
    //        iframe.setAttribute('height', '480')
    //        iframe.setAttribute('width', '640')
    var tr = myDocument.createElement('TR')
    tr.appendChild(iframe)
    div.appendChild(tr)
    return div
  }
}
// ends
