'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ReadingOrderingQuestion({ question, onAnswerChange }) {
  const [sourceItems, setSourceItems] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);

  useEffect(() => {
    // Filter out instruction items (usually item_order === 0 or answer_text === 0)
    const orderableItems = question.items?.filter(item => {
      const position = parseInt(item.answer_text || item.item_order || 0);
      return position > 0;
    }) || [];

    // Initialize all items in source (shuffled order from backend)
    if (orderableItems && orderableItems.length > 0) {
      const items = orderableItems.map(item => ({
        id: item.id,
        text: item.item_text,
        original_order: parseInt(item.answer_text || item.item_order || 0)
      }));
      setSourceItems(items);
      setOrderedItems([]);
    }
  }, [question.id, question.items]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) return;

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'source') {
        const items = Array.from(sourceItems);
        const [removed] = items.splice(source.index, 1);
        items.splice(destination.index, 0, removed);
        setSourceItems(items);
      } else {
        const items = Array.from(orderedItems);
        const [removed] = items.splice(source.index, 1);
        items.splice(destination.index, 0, removed);
        setOrderedItems(items);
        
        onAnswerChange({
          answer_type: 'json',
          answer_json: JSON.stringify({ ordered_items: items })
        });
      }
    } else {
      // Moving between lists
      if (source.droppableId === 'source') {
        const sourceClone = Array.from(sourceItems);
        const destClone = Array.from(orderedItems);
        const [removed] = sourceClone.splice(source.index, 1);
        destClone.splice(destination.index, 0, removed);
        
        setSourceItems(sourceClone);
        setOrderedItems(destClone);
        
        onAnswerChange({
          answer_type: 'json',
          answer_json: JSON.stringify({ ordered_items: destClone })
        });
      } else {
        const sourceClone = Array.from(orderedItems);
        const destClone = Array.from(sourceItems);
        const [removed] = sourceClone.splice(source.index, 1);
        destClone.splice(destination.index, 0, removed);
        
        setOrderedItems(sourceClone);
        setSourceItems(destClone);
        
        onAnswerChange({
          answer_type: 'json',
          answer_json: JSON.stringify({ ordered_items: sourceClone })
        });
      }
    }
  };

  return (
    <Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3}>
          {/* Source Items */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              All sentences have been ordered:
            </Typography>
            <Droppable droppableId="source">
              {(provided, snapshot) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    minHeight: 400,
                    p: 2,
                    backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : '#fafafa',
                    border: '2px dashed',
                    borderColor: snapshot.isDraggingOver ? '#2196f3' : '#ccc',
                    borderRadius: 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {sourceItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={`source-${item.id}`} index={index}>
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          elevation={snapshot.isDragging ? 4 : 1}
                          sx={{
                            p: 2,
                            mb: 2,
                            cursor: 'grab',
                            userSelect: 'none',
                            backgroundColor: snapshot.isDragging ? '#bbdefb' : 'white',
                            border: '1px solid',
                            borderColor: snapshot.isDragging ? '#2196f3' : '#e0e0e0',
                            '&:active': {
                              cursor: 'grabbing'
                            }
                          }}
                        >
                          <Typography variant="body2">
                            {item.text}
                          </Typography>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {sourceItems.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      Tất cả câu đã được sắp xếp
                    </Typography>
                  )}
                </Box>
              )}
            </Droppable>
          </Grid>

          {/* Ordered Items */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Ordered sequence:
            </Typography>
            <Droppable droppableId="ordered">
              {(provided, snapshot) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    minHeight: 400,
                    p: 2,
                    backgroundColor: snapshot.isDraggingOver ? '#e8f5e9' : 'white',
                    border: '2px solid',
                    borderColor: snapshot.isDraggingOver ? '#4caf50' : '#e0e0e0',
                    borderRadius: 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {orderedItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={`ordered-${item.id}`} index={index}>
                      {(provided, snapshot) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          elevation={snapshot.isDragging ? 4 : 2}
                          sx={{
                            p: 2,
                            mb: 2,
                            cursor: 'grab',
                            userSelect: 'none',
                            backgroundColor: snapshot.isDragging ? '#c8e6c9' : 'white',
                            border: '1px solid',
                            borderColor: snapshot.isDragging ? '#4caf50' : '#e0e0e0',
                            '&:active': {
                              cursor: 'grabbing'
                            }
                          }}
                        >
                          <Typography variant="body2">
                            <strong>{index + 1}.</strong> {item.text}
                          </Typography>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {orderedItems.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      Drag sentences here to order
                    </Typography>
                  )}
                </Box>
              )}
            </Droppable>
          </Grid>
        </Grid>
      </DragDropContext>
    </Box>
  );
}
