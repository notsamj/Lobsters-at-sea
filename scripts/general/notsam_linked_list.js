/*
    Class Name: NotSamLinkedList
    Class Description: A doubly linked list implementation
    Note: This code has been tested with a comprehensive suite. JavaScript_REUSEABLE\Linked List Array List. Caution: May have been modified since testing.
*/
class NotSamLinkedList {
    /*
        Method Name: constructor
        Method Parameters: 
            providedList=null:
                Initial list
        Method Description: constructor
        Method Return: constructor
    */
    constructor(providedList=null){
        this.head = null;
        this.end = null;
        this.storedLength = 0;
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;

        if (providedList != null){
            this.updateFromList(providedList);
        }
    }

    /*
        Method Name: updateFromList
        Method Parameters: 
            list:
                A list to update from
        Method Description: Adds a list to the linked list
        Method Return: void
    */
    updateFromList(list){
        for (let element of list){
            this.push(element);
        }
    }

    /*
        Method Name: print
        Method Parameters: None
        Method Description: Prints the contents
        Method Return: void
    */
    print(){
        console.log("Linked List");
        console.log("Size", this.getSize());
        console.log("Length", this.getLength());
        for (let [element, elementIndex] of this){
            console.log("@ Index", elementIndex, "has", element, "fetched", this.get(elementIndex));
        }
    }
    
    /*
        Method Name: clear
        Method Parameters: None
        Method Description: Clears the linked list
        Method Return: void
    */
    clear(){
        this.head = null;
        this.end = null;
        this.storedLength = 0;
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;
    }
    
    /*
        Method Name: insert
        Method Parameters: 
            value:
                A value. Variable type.
            index:
                An index. int
        Method Description: Inserts a value into the list at an index
        Method Return: void
    */
    insert(value, index){
        let size = this.getSize();
        if (index > size || index < 0){
            throw new Error("Invalid insertion index! (" + index.toString() + ')');
        }
        
        let newNode = new DLLNode(null, value);

        // If empty list
        if (size === 0){
            this.head = newNode;
            this.end = newNode;
            this.storedLength = 1;
            return;
        }
        // if the list is not empty but this is the last element
        else if (index === size){
            // Replace null with newNode
            this.end.next = newNode;

            // Prepare both sides of newNode
            newNode.previous = this.end;
            newNode.next = null;

            // Set the end
            this.end = newNode;
        }
        // Else its replacing somewhere in the middle (or first element)
        else{
            let existingNode = this.getNode(index);
            
            newNode.previous = existingNode.previous;
            newNode.next = existingNode;
            // If this isn't the first node
            if (index != 0){
                existingNode.previous.next = newNode;
            }
            existingNode.previous = newNode;

            // Modify last accessed if its being moved up
            if (index <= this.lastAccessedIndex){
                this.lastAccessedIndex += 1;
            }

            if (index === 0){
                this.head = newNode;
            }
        }

        this.storedLength++;
    }
    
    /*
        Method Name: append
        Method Parameters: 
            value:
                A value. Variable type.
        Method Description: Attaches a value to the end of the linked list
        Method Return: void
    */
    append(value){
        this.insert(value, this.getSize());
    }

    /*
        Method Name: push
        Method Parameters: 
            value:
                A value. Variable type.
        Method Description: Attaches a value to the end of the linked list
        Method Return: void
    */
    push(value){ this.append(value); }

    
    /*
        Method Name: add
        Method Parameters: 
            value:
                A value. Variable type.
        Method Description: Attaches a value to the end of the linked list
        Method Return: void
    */
    add(value){ this.append(value); }

    
    /*
        Method Name: calculateSize
        Method Parameters: None
        Method Description: Calculates the size of the linked list
        Method Return: int
    */
    calculateSize(){
        let current = this.head;
        let size = 0;
        // Loop through the list
        while (current != null){
            current = current.next;
            size += 1;
        }
        return size;
    }

    
    /*
        Method Name: getSize
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getSize(){
        return this.storedLength;
    }

    
    /*
        Method Name: getLength
        Method Parameters: None
        Method Description: Getter
        Method Return: int
    */
    getLength(){
        return this.getSize();
    }

    
    /*
        Method Name: get
        Method Parameters: 
            index:
                An index. int
        Method Description: Get the value at an index
        Method Return: Variable
    */
    get(index){
        let node = this.getNode(index);
        return node.value;
    }

    /*
        Method Name: getNode
        Method Parameters: 
            index:
                An index. int
        Method Description: Gets a node at an index
        Method Return: Node or null
    */
    getNode(index){
        // If the index is out of bounds
        if (this.getSize() < index + 1 || index < 0){
            throw new Error("Issue @ Index: " + index.toString() + "(List Size: " + this.getSize().toString() + ")\n");
            return null;
        }

        let distanceToFront = index;
        let distanceToBack = this.getSize() - 1 - index;
        let distanceToLastAccessed = Math.abs(this.lastAccessedIndex - index);
        // If last accessed is not available, give it a distance too big to be used
        if (this.lastAccessedIndex === -1){
            distanceToLastAccessed = this.getSize(); // The polet is now its higher than distance to front and back
        }

        // Determine starting node
        let current = null;
        let direction;
        let currentIndex;
        if (distanceToFront <= distanceToBack && distanceToFront <= distanceToLastAccessed){
            current = this.head;
            direction = 1;
            currentIndex = 0;
        }else if (distanceToBack <= distanceToFront && distanceToBack <= distanceToLastAccessed){
            current = this.end;
            direction = -1;
            currentIndex = this.getSize() - 1;
        }else{ // last accessed is the closest
            current = this.lastAccessed;
            if (this.lastAccessedIndex > index){
                direction = -1;
            }else{
                direction = 1;
            }
            currentIndex = this.lastAccessedIndex;
        }

        // Loop until desired index
        while(currentIndex != index){
            if (direction > 0){
                current = current.next;
            }else{
                current = current.previous;
            }
            currentIndex += direction;
        }
        return current;
    }

    /*
        Method Name: search
        Method Parameters: 
            value:
                A value. Variable type.
        Method Description: Searches the linked list for a value
        Method Return: int
    */
    search(value){
        let index = -1;
        let current = this.head;
        let i = 0;
        // Loop through the list
        while (current != null){
            if (current.value === value){
                return i;
            }
            current = current.next;
            i++;
        }
        return -1; // not found
    }

    
    /*
        Method Name: pop
        Method Parameters: 
            index:
                An index. int
        Method Description: Removes and returns the element at an index
        Method Return: void
    */
    pop(index){
        let size = this.getSize();
        if (!((index >= 0 && index < size))){
            throw new Error("Received invalid removal index");
        }
        let returnValue;

        // If we are removing the last accessed element
        if (this.lastAccessedIndex === index){
            this.lastAccessed = null;
            this.lastAccessedIndex = -1;
        }
        // Otherwise we can make a change if it is above the removed value
        else if (this.lastAccessedIndex > index){
            this.lastAccessedIndex -= 1;
        }

        // If we are remvoing the only element
        if (size === 1){
            returnValue = this.head.value;
            this.head = null;
            this.end = null;
        }
        // If we are removing the first element (and length > 1)
        else if (index === 0){
            returnValue = this.head.value;
            this.head = this.head.next;
            if (this.head != null){
                this.head.previous = null;
            }
        }
        // If we are removing the last element (and length > 1)
        else if (index === size - 1){
            returnValue = this.end.value;
            this.end = this.end.previous;
            if (this.end != null){
                this.end.next = null;
            }
        }else{
            let node = this.getNode(index);
            returnValue = node.value;
            let previous = node.previous; // MUSNOBE NULL OR ERROR
            previous.next = node.next;
            // If this is the last node then it would be 0
            if (node.next != null){
                node.next.previous = previous;
            }
        }
        this.storedLength--;
        return returnValue;
    }

    /*
        Method Name: remove
        Method Parameters: 
            index:
                An index. int
        Method Description: Removes the element at an index
        Method Return: void
    */
    remove(index){
        this.pop(index);
    }

    
    /*
        Method Name: set
        Method Parameters: 
            index:
                An index. int
            value:
                A value. Variable type.
        Method Description: Sets the value at an index
        Method Return: void
    */
    set(index, value){
        let node = this.getNode(index);
        node.value = value;
    }

    
    /*
        Method Name: isEmpty
        Method Parameters: None
        Method Description: Checks if empty
        Method Return: bool
    */
    isEmpty(){
        return this.storedLength === 0;
    }

    /*
        Method Name: getLastNode
        Method Parameters: None
        Method Description: Gets the last node
        Method Return: void
    */
    getLastNode(){
        return this.end;
    }

    
    /*
        Method Name: deleteWithCondition
        Method Parameters: 
            conditionFunction:
                A condition function, return: true -> delete, false -> do not deleted
        Method Description: Applies a condition function to each value and removes those that match
        Method Return: void
    */
    deleteWithCondition(conditionFunction){
        if (this.isEmpty()){ return; }
        let current = this.getLastNode();
        while (current != null){
            // If value matches condition then remove it
            if (conditionFunction(current.value)){
                if (current.next != null){
                    current.next.previous = current.previous;
                }else{ // Else this is the end
                    this.end = current.previous;
                }
                if (current.previous != null){
                    current.previous.next = current.next;
                }else{ // Else this is the head
                    this.head = current.next;
                }
            }
            // Move to next
            current = current.previous;
        }
        // Clear last accessed
        this.lastAccessed = null;
        this.lastAccessedIndex = -1;
        this.storedLength = this.calculateSize();
    }

    /*
        Method Name: iterator
        Method Parameters: None
        Method Description: Iterates through the items in the linked list and yields them
        Method Return: [value, index]
    */
    *[Symbol.iterator](){
        let current = this.head;
        let i = 0;
        while (current != null){
            yield [current.value, i];
            current = current.next;
            i++;
        }
    }

}
/*
    Class Name: DLLNode
    Class Description: A doubly linked list node
*/
class DLLNode {
    /*
        Method Name: constructor
        Method Parameters: 
            previous:
                The previous node. DLLNode.
            value:
                A value. Variable type.
        Method Description: constructor
        Method Return: constructor
    */
    constructor(previous, value){
        this.value = value;
        this.previous = previous;
        this.next = null;
    }
}
// If using NodeJS -> Export the class
if (typeof window === "undefined"){
    module.exports = NotSamLinkedList;
}