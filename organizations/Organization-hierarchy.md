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
color is amoung white,red,orange,yellow,green,blue,violet,brown,black

The component is made of 2 tabs "Hierarchy" and "Organizations".

Hierarchy tab:
The panel has two columns.
In the left column, a form allow to create an organization type.
In the right column a table display all the types and allow for inline edition and deletion of a row.


Organizations tab :
The panel has 3 tabs Table, Indented, Tidy.
In the table tab there are two columns
  In the left column, a form allow to create an organization instance. 
    Initially the type is set to the root organization type, if the user select a type the proposed parent should only be of the selected type parent types.
    The selected type should be memorized so that after adding an instance the user can easily add a second instance of the same type.
    the Parent dropdown should be set by default to the first value of the value list.
  In the right column a table display all the instances and allow for inline edition and deletion of a row.
In the Tree tab, the panel show the hierarchy of organization instances as a [indented tree](https://observablehq.com/@d3/indented-tree).
In the Tidy tab, the organizations are shown as [tidy tree]https://observablehq.com/@d3/tree/2?intent=fork 

Check if the elements exist before trying to add event listeners to them. 

Implement the interaction with the backend by creating a dedicated js library which either store the data in localstorage or in supabase if the user is logged in.
the hierarchy json is stored in the property "hierarchy" of the table "client"
the instances are stored in the table "organization" (columns : name, type, parent_organization_id) 

create a login page that allow user to login using supabase auth. or work locally.

