import { PaneDefinition } from '../types'
import UI from 'solid-ui'
import { NamedNode, parse } from 'rdflib'

const kb = UI.store

export const basicPreferencesPane: PaneDefinition = {
  icon: UI.icons.iconBase + 'noun_Sliders_341315_000000.svg',
  name: 'basicPreferences',
  label: (subject) => {
    if (subject.uri === subject.site().uri) {
      return 'Prefs'
    }
    return null
  },

  // Render the pane
  // The subject should be the logged in user.
  render: (subject: NamedNode, dom: HTMLDocument) => {
    function complainIfBad (ok: Boolean, mess: any) {
      if (ok) return
      container.appendChild(UI.widgets.errorMessageBlock(dom, mess, '#fee'))
    }

    const container = dom.createElement('div')

    const formArea = container.appendChild(dom.createElement('div'))

    /* Preferences
    **
    **  Things like whether to color text by author webid, to expand image URLs inline,
    ** expanded inline image height. ...
    ** In general, preferences can be set per user, per user/app combo, per instance,
    ** and per instance/user combo. (Seee the long chat pane preferences for an example.)
    ** Here in the basic preferences, we are only setting  per-user defaults.
    */

    const preferencesFormText = `

  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
  @prefix solid: <http://www.w3.org/ns/solid/terms#>.
  @prefix ui: <http://www.w3.org/ns/ui#>.
  @prefix : <#>.

  :this
    <http://purl.org/dc/elements/1.1/title> "Basic preferences" ;
    a ui:Form ;
    ui:part :powerUser, :developerUser;
    ui:parts ( :powerUser :developerUser  ).

:powerUser a ui:BooleanField; ui:property solid:powerUser;
  ui:label "I am a Power User".
:developerUser a ui:BooleanField; ui:property solid:developerUser;
  ui:label "I am a Developer".
`

const preferencesFormText2 = `

@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix : <#>.

:this
<http://purl.org/dc/elements/1.1/title> "Basic preferences" ;
a ui:Form ;
ui:part :categorizeUser, :privateComment, :personalInformationHeading;
ui:parts ( :personalInformationHeading :privateComment :categorizeUser ).

:personalInformationHeading a ui:Heading; ui:contents "Personal information".
:privateComment a ui:Comment; ui:contents "This information is private.".
:categorizeUser a ui:Classifier; ui:label "Level of user"; ui:property rdf:type ; ui:category solid:User.
`

const ontologyData = `
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix schema: <http:/schema.org/>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
@prefix : <#>.

solid:User a rdfs:Class;
  rdfs:label "user"@en, "utilisateur"@fr;
  rdfs:comment """Any person who might use a Solid-based system""";
  rdfs:subClassOf foaf:Person, schema:Person, vcard:Individual.

# Since these options are opt-in, it is a bit strange to have new users opt in
# That they are new users - also we do not use this class for anything specific
# yet
# solid:NewUser a rdfs:Class;
#  rdfs:label "new user"@en;
#  rdfs:comment """A person who might use a Solid-based system who has low
#  level of familarity with technical details.""";
#  rdfs:subClassOf solid:User.

solid:PowerUser a rdfs:Class;
  rdfs:label "power user"@en;
  rdfs:comment """A person who might use a Solid-based system
  who is prepared to be given a more complex interface in order
  to be provided with more pwerful features.""";
  rdfs:subClassOf solid:User.

  solid:Developer a rdfs:Class;
    rdfs:label "Developer";
    rdfs:comment """Any person who might use a Solid-based system,
    who has software development skills.""";
    rdfs:subClassOf solid:User.
`
    function loadData (doc: NamedNode, turtle: String) {
      doc = doc.doc() // remove # from URI if nec
      if (!kb.holds(undefined, undefined, undefined, doc)) { // If not loaded already
        (parse as any)(turtle, kb, doc.uri, 'text/turtle', null) // Load form directly
      }
    }
    const preferencesForm = kb.sym('urn:uuid:93774ba1-d3b6-41f2-85b6-4ae27ffd2597#this')
    loadData(preferencesForm, preferencesFormText2)

    const ontologyExtra = kb.sym('urn:uuid:93774ba1-d3b6-41f2-85b6-4ae27ffd2597-ONT')
    loadData(ontologyExtra, ontologyData)

    async function doRender () {
      var context = await UI.authn.logInLoadPreferences({dom, div: container})
      if (!context.preferencesFile) {  // Could be CORS
        console.log('Not doing private class preferences as no access to preferences file. ' + context.preferencesFileError)
        return
      }
      const appendedForm = UI.widgets.appendForm(dom, formArea, {}, context.me, preferencesForm, context.preferencesFile, complainIfBad)
      appendedForm.style.borderStyle = 'none'
    }
    doRender()

    // todo make Statement type for fn below
    // let preferenceProperties = kb.statementsMatching(null, ns.ui.property, null, preferencesFormDoc).map(function (st: any) { return st.object })
    // var me = UI.authn.currentUser()
    // var context = {noun: 'chat room', me: me, statusArea: statusArea, div: formArea, dom, kb}
    // container.appendChild(UI.preferences.renderPreferencesForm(me, mainClass, preferencesForm, context))
    return container
  }
}

export default basicPreferencesPane
// ends
