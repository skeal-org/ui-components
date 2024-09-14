Please create a web component and its associated html page that will allow a client to define its organization types 
and manage the hierarchy of organizations instances in an easy graphical way.

Client organisation types are stored as a json
```
{
  "root":{"name":"Headquarters","parent":[],"data_access":"chidren","color":"red"},
  "region":{"name":"Regions", "parent": ["root"], "data_access":"children","color":"orange"},
  "facility":{"name":"Facilities", "parent": ["region"], "data_access":"descandents","color":"green"},
  "unit":{"name":"Units", "parent": ["facility","region"], "data_access":"own","color":"blue"}
}
```
Each type has a name, a list of possible parent types a data access mode and a color.
An organization of some specified type can only be parented by an organization belonging to the parent type.
In the example above we can only create a facility under a region, but we can create a unit either under a facility or a region.
the data access mode is one of
* own : The organization will only access its own data
* children : The organization will access its data and the one of all its children but not the ones of the grand-children,...
* descendants : The organization will access its data and the one of all its children, grand-children,...

The component is made of 2 tabs Types and Hierarchy.

Types tab:
The panel has two columns.
In the left column, a form allow to create an organization type.
In the right column a table display all the types and allow for inline edition and deletion of a row.

Hierarchy tab:
The panel has two columns.
In the left column, a form allow to create an organization instance. 
  Initially the type is set to the root organization type, if the user select a type the proposed parent should only be of the selected type parent types.
  The selected type should be memorized so that after adding an instance the user can easily add a second instance of the same type.
In the right column a panel contains 2 tabs Tree and Graph
In the Tree tab, the panel show the hierarchy of organization instances as a html tree.
  By using drag and drop he can easily change the parent of a node, when overing other nodes, a red cross icon is shown when the type is not compatible or a green one if comptatible
In the Graph tab, each node (i.e. instance) is displayed using D3.js has block of the color of its type and display the organization name, an arrow attach it to its parent. 

Implement the interaction with the backend by specifying the Crud endpoints.
the hierarchy json is stored in the property "hierarchy" of the table "client"
the instances are stored in the table "organization" (columns : name, type, parent_organization_id) 

Mock those endpoints by storing the data in local storage so it is not loss when the user reload the page.
