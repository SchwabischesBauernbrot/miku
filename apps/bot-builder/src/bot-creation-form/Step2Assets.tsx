// Step2Assets.tsx
import React, { useRef, useState } from "react";
import { useCharacterCreationForm } from "./CharacterCreationFormContext";

import {
  Accordion,
  AccordionItem,
  Button,
  Container,
  DragAndDropImages,
  Dropdown,
  Input,
  TextHeading,
} from "@mikugg/ui-kit";

import { checkImageDimensionsAndType } from "./libs/utils";

import { v4 as uuidv4 } from 'uuid';
import { emotionTemplates } from "./data/emotions";

const BackgroundsForm: React.FC = () => {
  const { card, setCard } = useCharacterCreationForm();

  const backgroundImagesInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const validImages: {
        id: string
        description: string
        source: string
      }[] = [];

      for (const file of Array.from(files)) {
        const isValidSize = await checkImageDimensionsAndType(file, [
          "image/png",
          "image/jpeg",
        ]);
        if (isValidSize) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          await new Promise((resolve) => {
            reader.onloadend = () => {
              validImages.push({
                source: reader.result as string,
                description: "",
                id: uuidv4()
              });
              resolve(null);
            };
          });
        } else {
          alert(
            "Background images should be png or jpg"
          );
        }
      }

      setCard({
        ...card,
        data: {
          ...card.data,          
          extensions: {
            ...card.data.extensions,
            mikugg: {
              ...(card.data.extensions.mikugg || {}),
              backgrounds: [
                ...(card.data.extensions.mikugg?.backgrounds || []),
                ...validImages
              ],
              scenarios: card.data.extensions.mikugg?.scenarios?.map(scenario => ({
                ...scenario,
                background: scenario.background || (
                  validImages.length ? validImages[0].id : ''
                )
              }))
            }
          }
        }
      });
    }

    event.target.value = "";
  };

  const handleRemoveBackgroundImage = (index: number) => {
    const background = card.data.extensions.mikugg?.backgrounds[index];
    const newBackgroundImages = [...(card.data.extensions.mikugg?.backgrounds || [])];
    newBackgroundImages.splice(index, 1);
    setCard({
      ...card,
      data: {
        ...card.data,          
        extensions: {
          ...card.data.extensions,
          mikugg: {
            ...(card.data.extensions.mikugg || {}),
            backgrounds: newBackgroundImages,
            scenarios: card.data.extensions.mikugg?.scenarios?.map(scenario => ({
              ...scenario,
              background: scenario.background === background.id ? (
                newBackgroundImages.length ? newBackgroundImages[0].id : ''
              ) : scenario.background
            }))
          }
        }
      }
    });
  };

  const handleBackgroundImageDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const updatedBackgroundImages = [...(card.data.extensions.mikugg?.backgrounds || [])];
    updatedBackgroundImages[index] = {
      ...updatedBackgroundImages[index],
      description: event.target.value,
    };
    setCard({
      ...card,
      data: {
        ...card.data,          
        extensions: {
          ...card.data.extensions,
          mikugg: {
            ...(card.data.extensions.mikugg || {}),
            backgrounds: updatedBackgroundImages
          }
        }
      }
    });
  };

  return (
    <div className="step2Assets__formGroup">
      <label htmlFor="backgroundImage">
        Upload Background Images: (16:9 format preferred)
      </label>
      {card.data.extensions.mikugg?.backgrounds?.map((backgroundImage, index) => (
        <div key={index} className="step2Assets__backgroundImagePreview">
          <img
            src={backgroundImage.source}
            alt={`Background Image ${index}`}
            height={256}
          />
          <input
            type="text"
            placeholder="Image description"
            value={backgroundImage.description || ""}
            onChange={(e) => handleBackgroundImageDescriptionChange(e, index)}
          />
          <Button
            theme="secondary"
            onClick={() => handleRemoveBackgroundImage(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <input
        type="file"
        id="backgroundImage"
        name="backgroundImage"
        accept="image/png,image/jpeg"
        ref={backgroundImagesInputRef}
        onChange={handleBackgroundImageChange}
        className="step2Assets__backgroundImageInput"
        multiple
      />
    </div>
  );
}

interface EmotionGroup {
  id: string
  template: string
  emotions: {id: string, source: string[]}[]
}

const EmotionsForm: React.FC = () => {
  const { card, setCard } = useCharacterCreationForm();
  const [selectedItemByIndex, setSelectedItemByIndex] = useState<number>(0);
  const [expandedTemplateDropdown, setExpandedTemplateDropdown] =
    useState(false);

  const handleAddGroup = () => {
    const newGroup: EmotionGroup = {
      id: '',
      template: 'base-emotions',
      emotions: [],
    };
    setCard({
      ...card,
      data: {
        ...card.data,
        extensions: {
          ...card.data.extensions,
          mikugg: {
            ...(card.data.extensions.mikugg || {}),
            emotion_groups: [...(card.data.extensions.mikugg?.emotion_groups || []), newGroup],
            scenarios: card.data.extensions.mikugg?.scenarios?.map(scenario => ({
              ...scenario,
              emotion_groups: scenario.emotion_group || newGroup.id
            }))
          }
        }
      }
    });
  };

  const handleRemoveGroup = (index: number) => {
    if (card.data.extensions.mikugg?.emotion_groups) {
      const emotionGroup = card.data.extensions.mikugg?.emotion_groups?.[index];
      const newGroups = [...card.data.extensions.mikugg?.emotion_groups];
      newGroups.splice(index, 1);
      setCard({
        ...card,
        data: {
          ...card.data,
          extensions: {
            ...card.data.extensions,
            mikugg: {
              ...(card.data.extensions.mikugg || {}),
              emotion_groups: newGroups,
              scenarios: card.data.extensions.mikugg?.scenarios?.map(scenario => ({
                ...scenario,
                emotion_group: scenario.emotion_group === emotionGroup.id ? (
                  newGroups.length ? newGroups[0].id : ''
                ) : scenario.emotion_group
              }))
            }
          }
        }
      })
    }
  };

  const handleTemplateChange = (selectedIndex: number, groupIndex: number) => {
    const selectedTemplateId = emotionTemplates[selectedIndex].id;

    if (card.data.extensions.mikugg.emotion_groups) {
      const newGroups = [...card.data.extensions.mikugg.emotion_groups];

      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        template: selectedTemplateId,
        emotions: [],
      };

      setCard({
        ...card,
        data: {
          ...card.data,
          extensions: {
            ...card.data.extensions,
            mikugg: {
              ...(card.data.extensions.mikugg || {}),
              emotion_groups: newGroups,
            }
          }
        }
      });
    }
  };

  const getDropdownEmotionTemplateIndex = (groupIndex: number) => {
    return emotionTemplates.findIndex(
      ({ id }) =>
        id === card.data.extensions.mikugg.emotion_groups[groupIndex].template
    );
  };

  const handleEmotionGroupIdChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    groupIndex: number
  ) => {
    const { value } = event.target;
    if (card.data.extensions.mikugg.emotion_groups) {
      const newGroups = [...card.data.extensions.mikugg.emotion_groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        id: value,
      };

      setCard({
        ...card,
        data: {
          ...card.data,
          extensions: {
            ...card.data.extensions,
            mikugg: {
              ...(card.data.extensions.mikugg || {}),
              emotion_groups: newGroups,
            }
          }
        }
      })
    }
  };

  const handleImageChange = async (
    file: File,
    groupIndex: number,
    emotionId: string
  ) => {
    if (file && card.data.extensions.mikugg.emotion_groups) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newGroups = [...card.data.extensions.mikugg.emotion_groups];
        const emotionTemplate = emotionTemplates.find(
          (template) => template.id === newGroups[groupIndex].template
        );

        if (emotionTemplate?.emotionIds.includes(emotionId) === false) {
          console.warn(`Invalid emotion id: ${emotionId}`);
          return;
        }

        const emotions = newGroups[groupIndex].emotions || [];
        const emotionIndex = emotions.findIndex((img) => img.id === emotionId);

        if (emotionIndex >= 0) {
          emotions[emotionIndex].source = [base64];
        } else {
          emotions.push({
            id: emotionId,
            source: [base64]
          });
        }

        newGroups[groupIndex].emotions = emotions;

        setCard({
          ...card,
          data: {
            ...card.data,
            extensions: {
              ...card.data.extensions,
              mikugg: {
                ...(card.data.extensions.mikugg || {}),
                emotion_groups: newGroups,
              }
            }
          }
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    groupIndex: number
  ) => {
    const files = event.target.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const emotionId = file.name.split(".")[0];
        handleImageChange(file, groupIndex, emotionId);
      }
    }
  };

  const renderEmotionGroups = () => {
    if (!card.data.extensions.mikugg.emotion_groups) return null;

    return card.data.extensions.mikugg.emotion_groups.map((group, groupIndex) => {
      const emotionsTemplate = emotionTemplates.find(
        (template) => template.id === group.template
      );
      const renderEmotionImages = () => {
        if (!emotionsTemplate) return null;

        return emotionsTemplate.emotionIds.map((emotionId) => {
          const PreviewImage = group.emotions.find(
            (img) => img.id === emotionId
          );

          return (
            <DragAndDropImages
              key={`emotion_${emotionId}_group_${group.template}_${groupIndex}`}
              size="sm"
              dragAreaLabel={emotionId}
              handleChange={(file) =>
                handleImageChange(file, groupIndex, emotionId)
              }
              previewImage={PreviewImage?.source[0]}
              placeHolder="(1024x1024)"
              errorMessage="Please upload PNG, GIF or WEBM."
              onFileValidate={(file) =>
                checkImageDimensionsAndType(file, [
                  "image/png",
                  "image/gif",
                  "video/webm",
                ])
              }
            />
          );
        });
      };

      return (
        <AccordionItem
          title={`Emotion Group ${groupIndex + 1}`}
          key={`group_${groupIndex}`}
          className="step2Assets__group"
        >
          <div className="step2Assets__formGroup">
            <Input
              label="Name:"
              placeHolder="Enter a name for this emotion group"
              id={`group_${groupIndex}_name`}
              name="id"
              value={group.id}
              onChange={(event) => handleEmotionGroupIdChange(event, groupIndex)}
            />
          </div>
          <div className="step2Assets__formGroup">
            <input
              type="file"
              multiple
              accept="image/png, image/gif, video/webm"
              onChange={(event) => handleMultipleImageChange(event, groupIndex)}
            />
          </div>
          <div className="step2Assets__formGroup">
            <label htmlFor={`group_${groupIndex}_emotionsHash`}>
              Emotion Set:
            </label>
            <Dropdown
              items={emotionTemplates}
              onChange={(index) => handleTemplateChange(index, groupIndex)}
              expanded={expandedTemplateDropdown}
              onToggle={setExpandedTemplateDropdown}
              selectedIndex={getDropdownEmotionTemplateIndex(groupIndex)}
            />
          </div>
          <div className="step2Assets__emotions">
            {renderEmotionImages()}
          </div>
        </AccordionItem>
      );
    });
  };

  return (
    <div>
      <Accordion
        selectedIndex={selectedItemByIndex}
        onChange={(index) => setSelectedItemByIndex(index)}
        onRemoveItem={(index) => handleRemoveGroup(index)}
      >
        {renderEmotionGroups()}
      </Accordion>
      <Button theme="gradient" onClick={handleAddGroup}>
        + Add Emotion Group
      </Button>
    </div>
  )
}

const Step2Assets: React.FC = () => {
  return (
    <Container className="step2Assets">
      <TextHeading size="h2">Step 2: Assets</TextHeading>
      <TextHeading size="h3">Backgrounds</TextHeading>
      <BackgroundsForm />
      <TextHeading size="h3">Emotion groups</TextHeading>
      <EmotionsForm />
    </Container>
  );
};

export default Step2Assets;